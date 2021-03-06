//
//   Copyright 2009-2014 Ilkka Oksanen <iao@iki.fi>
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing,
//   software distributed under the License is distributed on an "AS
//   IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
//   express or implied.  See the License for the specific language
//   governing permissions and limitations under the License.
//

/* globals $ */

import Ember from 'ember';
import { dispatch } from 'emflux/dispatcher';

const CURSORWIDTH = 50;

export default Ember.Component.extend({
    stores: Ember.inject.service(),

    classNames: [ 'grid', 'flex-1', 'flex-grow-column' ],

    dimensions: null,
    cursor: {},
    movingWindow: null,

    relayoutScheduled: false,
    relayoutAnimate: null,

    windowComponents: null,

    model: Ember.computed.alias('stores.windows.windows'),

    mustRelayout: Ember.observer('stores.windows.initDone', 'stores.settings.theme', function() {
        Ember.run.next(this, function() { this._layoutWindows(false); });
    }),

    mustRelayoutAfterRender: Ember.observer(
        'stores.windows.alerts.[]', 'stores.settings.emailConfirmed', function() {
        Ember.run.scheduleOnce('afterRender', this, function() {
            this._layoutWindows(false);
        });
    }),

    init() {
        this._super();

        this.set('windowComponents', Ember.A([]));
    },

    actions: {
        joinLobby() {
            dispatch('JOIN_GROUP', {
                name: 'lobby',
                network: 'MAS',
                password: ''
            });
        },

        relayout(options) {
            if (!this.get('stores.windows.initDone')) {
                return;
            }

            // If there's at least one relayout call without animation, it takes precedence.
            if (this.relayoutAnimate === null || this.relayoutAnimate === true) {
                this.relayoutAnimate = options.animate;
            }

            if (this.relayoutScheduled) {
                return;
            }

            this.relayoutScheduled = true;

            Ember.run.next(this, function() {
                this.relayoutScheduled = false;
                this._layoutWindows(this.relayoutAnimate);
                this.relayoutAnimate = null;
            });
        },

        dragWindowStart(discussionWindow, event) {
            this._dragWindowStart(discussionWindow, event);
        },

        registerWindow(discussionWindow) {
            this.get('windowComponents').addObject(discussionWindow);
        },

        unregisterWindow(discussionWindow) {
            this.get('windowComponents').removeObject(discussionWindow);
        }
    },

    didInsertElement() {
        $(window).on('resize', Ember.run.bind(this, function() {
            this._layoutWindows(false);
        }));
    },

    _dragWindowStart(discussionWindow, event) {
        this.movingWindow = discussionWindow;
        this.set('draggedWindow', discussionWindow);

        this.movingWindow.$().addClass('moving').css('z-index', 200);
        $('#window-cursor').show();

        this._dragWindow(event);

        let handleDragMove = dragMoveEvent => this._dragWindow(dragMoveEvent);
        let handleDragEnd = dragEndEvent => {
            this._dragWindowEnd(dragEndEvent);

            document.removeEventListener('mousemove', handleDragMove, false);
            document.removeEventListener('mouseup', handleDragEnd, false);
        }

        document.addEventListener('mousemove', handleDragMove, false);
        document.addEventListener('mouseup', handleDragEnd, false);
    },

    _dragWindow(event) {
        let cursor = this._calculateCursorPosition(event);

        if (cursor.x === null && this.cursor.x === null) {
            // Still outside of grid
            return;
        }

        if (this.cursor.x !== cursor.x || this.cursor.y !== cursor.y ||
            (cursor.section !== 'middle' && cursor.section !== this.cursor.section)) {
            this.cursor = cursor;

            this._drawCursor(cursor);

            this.dimensions.forEach(function(row, rowIndex) {
                row.forEach(function(masWindow, columnIndex) {
                    this._markWindow(masWindow, columnIndex, rowIndex, cursor);
                }.bind(this));
            }.bind(this));

            this._animate(200);
        }

        event.preventDefault();
    },

    _dragWindowEnd(event) {
        let cursor = this.cursor;

        this.set('draggedWindow', false);
        this.movingWindow.$().removeClass('moving').css('z-index', '');
        $('#window-cursor').hide();

        let desktop = $(event.target).data('desktop-id');

        if (desktop) {
            let desktopId = desktop === 'new' ? Math.floor(new Date() / 1000) : parseInt(desktop);

            dispatch('MOVE_WINDOW', {
                column: 0,
                row: 0,
                desktop: desktopId,
                window: this.movingWindow.get('content')
            });

            dispatch('CHANGE_ACTIVE_DESKTOP', {
                desktop: desktopId
            });
            return;
        }

        if (cursor.x === null) {
            return;
        }

        for (let [ rowIndex, row ] of this.dimensions.entries()) {
            for (let [ columnIndex, masWindow ] of row.entries()) {
                masWindow.cursor = 'none';

                let deltaX = 0;
                let deltaY = 0;
                let oldRow = masWindow.component.get('row');
                let oldColumn = masWindow.component.get('column');

                if (cursor.section === 'top' || cursor.section === 'bottom') {
                    deltaY = rowIndex > cursor.y || (rowIndex === cursor.y &&
                        cursor.section === 'top') ? 1 : 0;
                } else {
                    deltaX = rowIndex === cursor.y && (columnIndex > cursor.x ||
                        (columnIndex === cursor.x && cursor.section === 'left')) ? 1 : 0;
                }

                let newRow = rowIndex + deltaY;
                let newColumn = columnIndex + deltaX;

                if (oldRow !== newRow || oldColumn !== newColumn) {
                    dispatch('MOVE_WINDOW', {
                        column: newColumn,
                        row: newRow,
                        window: masWindow.component.get('content')
                    });
                }
            }
        }

        let newColumn = cursor.x + (cursor.section === 'right' ? 1 : 0);
        let newRow = cursor.y + (cursor.section === 'bottom' ? 1 : 0);

        dispatch('MOVE_WINDOW', {
            column: newColumn,
            row: newRow,
            window: this.movingWindow.get('content')
        });
    },

    _layoutWindows(animate) {
        let duration = animate ? 600 : 0;
        let windowComponents = this.get('windowComponents');
        let container = this._containerDimensions();
        let expandedWindow = windowComponents.findBy('expanded', true);

        if (expandedWindow) {
            expandedWindow.move({
                left: 0,
                top: 0,
                width: container.width,
                height: container.height
            }, duration);
            return;
        }

        let visibleWindows = windowComponents.filterBy('visible');
        let rowNumbers = visibleWindows.mapBy('row').uniq().sort();
        let rowHeight = Math.round(container.height / rowNumbers.length);

        let dimensions = [];

        rowNumbers.forEach(function(row, rowIndex) {
            let windowsInRow = visibleWindows.filterBy('row', row).sortBy('column');
            let windowWidth = Math.round(container.width / windowsInRow.length);

            dimensions.push([]);

            windowsInRow.forEach(function(windowComponent, columnIndex) {
                dimensions[rowIndex].push({
                    left: columnIndex * windowWidth,
                    top: rowIndex * rowHeight,
                    width: windowWidth,
                    height: rowHeight,
                    component: windowComponent
                });
            });
        });

        this.dimensions = dimensions;
        this._animate(duration);
    },

    _markWindow(masWindow, x, y, cursor) {
        masWindow.cursor = 'none';

        let rowCount = this.dimensions.length;
        let columnCount = this.dimensions[y].length;
        let section = cursor.section;

        if ((cursor.y === y && section === 'top') ||
            (y > 0 && cursor.y === y - 1 && section === 'bottom' )) {
            masWindow.cursor = 'top';
        } else if ((cursor.y === y && section === 'bottom') ||
            (y < rowCount - 1 && cursor.y === y + 1 && section === 'top' )) {
            masWindow.cursor = 'bottom';
        } else if (cursor.y === y && ((section === 'left' && cursor.x === x) ||
            (x > 0 && cursor.x === x - 1 && section === 'right'))) {
            masWindow.cursor = 'left';
        } else if (cursor.y === y && ((section === 'right' && cursor.x === x) ||
            (x < columnCount - 1 && cursor.x - 1 === x && section === 'left'))) {
            masWindow.cursor = 'right';
        }
    },

    _drawCursor(cursor) {
        if (cursor.x === null) {
            $('#window-cursor').hide();
            return;
        } else {
            $('#window-cursor').show();
        }

        let container = this._containerDimensions();
        let cursorPos = {};
        let cursorWindow = this.dimensions[cursor.y][cursor.x];
        let section = cursor.section;

        if (section === 'top' || section === 'bottom') {
            let topPos = (section === 'top' ?
                cursorWindow.top : cursorWindow.top + cursorWindow.height) - CURSORWIDTH / 2;

            if (cursor.y === 0 && section === 'top') {
                topPos = cursorWindow.top;
            } else if (cursor.y === this.dimensions.length - 1 && section === 'bottom') {
                topPos = cursorWindow.top + cursorWindow.height - CURSORWIDTH;
            }

            cursorPos = {
                left: 0,
                width: container.width,
                top: topPos,
                height: CURSORWIDTH
            };
        } else {
            let leftPos = (section === 'left' ?
                cursorWindow.left : cursorWindow.left + cursorWindow.width) - CURSORWIDTH / 2;

            if (cursor.x === 0 && section === 'left') {
                leftPos = cursorWindow.left;
            } else if (cursor.x === this.dimensions[cursor.y].length - 1 && section === 'right') {
                leftPos = cursorWindow.left + cursorWindow.width - CURSORWIDTH;
            }

            cursorPos = {
                left: leftPos,
                width: CURSORWIDTH,
                top: this.dimensions[cursor.y][0].top,
                height: this.dimensions[cursor.y][0].height
            };
        }

        $('#window-cursor').css(cursorPos);
    },

    _animate(duration) {
        this.dimensions.forEach(function(row, rowIndex) {
            row.forEach(function(windowDim, columnIndex) {
                let cursorSpace = this._calculateSpaceForCursor(
                    columnIndex, rowIndex, windowDim.cursor);

                let newDim = {
                    left: windowDim.cursor === 'left' ?
                        windowDim.left + cursorSpace : windowDim.left,
                    top: windowDim.cursor === 'top' ?
                        windowDim.top + cursorSpace : windowDim.top,
                    width: windowDim.cursor === 'left' || windowDim.cursor === 'right' ?
                        windowDim.width - cursorSpace : windowDim.width,
                    height: windowDim.cursor === 'top' || windowDim.cursor === 'bottom' ?
                        windowDim.height - cursorSpace : windowDim.height
                };

                let windowComponent = windowDim.component;
                windowComponent.move(newDim, duration);
            }.bind(this));
        }.bind(this));
    },

    _calculateSpaceForCursor(x, y, cursor) {
        let width = Math.round(CURSORWIDTH / 2);
        let rows = this.dimensions.length;
        let columns = this.dimensions[y].length;

        if ((y === 0 && cursor === 'top') || (y === rows - 1 && cursor === 'bottom') ||
            (x === 0 && cursor === 'left') || (x === columns - 1 && cursor === 'right')) {
            width = CURSORWIDTH;
        }

        return width;
    },

    _containerDimensions() {
        return {
            width: this.$().width(),
            height: this.$().height()
        };
    },

    _calculateCursorPosition(event) {
        const outOfBoundsCursor = { x: null, y: null, section: null };

        let x = event.clientX;
        let y = event.clientY;

        let windowX = 0;
        let windowY = 0;
        let masWindow;

        if (this._containerDimensions().width < x) {
            return outOfBoundsCursor;
        }

        this.dimensions.forEach(function(row, index) {
            if (row[0].top < y) {
                windowY = index;
            }
        });

        this.dimensions[windowY].forEach(function(column, index) {
            if (column.left < x) {
                windowX = index;
                masWindow = column;
            }
        });

        if (!masWindow) {
            return outOfBoundsCursor;
        } else {
            return {
                x: windowX,
                y: windowY,
                section: this._whichSection(masWindow, x, y)
            };
        }
    },

    _whichSection(windowDim, x, y) {
        // -----------------
        // |\      t      /|
        // | \           / |
        // |  -----------  |
        // |l |    m    | r|
        // |  -----------  |
        // | /     b     \ |
        // |/             \|
        // -----------------

        const BORDER = 50; // Defines the non-active area ('n' in the figure)

        let topOrRight = true;
        let bottomOrRight = false;

        if (windowDim.left + BORDER < x && windowDim.left + windowDim.width - BORDER > x &&
            windowDim.top + BORDER < y && windowDim.top + windowDim.height - BORDER > y) {
            return 'middle'; // m
        } else {
            if (windowDim.height * (x - windowDim.left) < windowDim.width * (y - windowDim.top)) {
                topOrRight = false;
            }

            if (windowDim.height * (windowDim.left + windowDim.width - x) <
                windowDim.width * (y - windowDim.top)) {
                bottomOrRight = true;
            }

            if (topOrRight && !bottomOrRight) {
                return 'top'; // t
            } else if (topOrRight && bottomOrRight) {
                return 'right'; // r
            } else if (!topOrRight && bottomOrRight) {
                return 'bottom'; // b
            } else if (!topOrRight && !bottomOrRight) {
                return 'left'; // l
            }
        }
    }
});
