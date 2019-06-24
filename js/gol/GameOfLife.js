$(document).ready(function () {
    console.log('Warming up....');
    const myBoard = new LifeBoard(50, 50, 10, 10);
    myBoard.initializeCanvas();
    // myBoard.funny();
    myBoard.buildBoard();
    // myBoard.nextTick();
    $('#startButton').click(() => {
        myBoard.run();
    });
    $('#nextTick').click(() => {
       myBoard.oneTick();
    });
    $('#stop').click(() => {
       myBoard.stop();
    });
    $('#cellStatus').change( event => {
        console.log('Change ', event.target.value);
        myBoard.drawingType = event.target.value;
        console.log('Why ', myBoard.drawingType);
    });
    // testRxJs();
});

function testRxJs() {
    console.log('Teting rxjs');
    rxjs.of(1, 2, 3)
        .subscribe(x => {
                const element = document.createElement('div');
                element.innerText = 'Data: ' + x;
                document.body.appendChild(element)
            },
            err => { },
            () => {
                const element = document.createElement('div');
                element.innerText = 'All done';
                document.body.appendChild(element)
            });
}

/***
 * Work in Progress WIP
 * Conway's Game of Life or as we say the High Life (taste great vs. less filling)
 */
class PlotterPoint {
    constructor(pointX, pointY) {
        this.pointX = pointX;
        this.pointY = pointY;
    }
}

class Cell {
    constructor(cellColumn = 0, cellWidth = 0, cellRow = 0, cellHeight = 0, cellStatus = 'dead', cellType = 'dynamic', cellColor = 'white') {
        this.cellOrigin = new PlotterPoint(cellColumn * cellWidth, cellRow * cellHeight);
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.cellStatus = cellStatus;
        this.cellType = cellType;
        this.cellColor = cellColor;
    }

    drawCell(mainContext) {
        if(this.cellStatus === 'dead') {
            this.cellColor = 'green';
        } else {
            this.cellColor = 'black';
        }
        mainContext.fillStyle = this.cellColor;
        mainContext.fillRect(this.cellOrigin.pointX, this.cellOrigin.pointY, this.cellWidth, this.cellHeight);
    }

    cloneCell(cell) {
        this.cellOrigin = cell.cellOrigin;
        this.cellWidth = cell.cellWidth;
        this.cellHeight = cell.cellHeight;
        this.cellStatus = cell.cellStatus;
        this.cellType = cell.cellType;
        this.cellColor = cell.cellColor;
    }
}

class LifeBoard {
    constructor(boardWidth, boardHeight, cellWidth, cellHeight) {
        console.log('Are you bored yet?');
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
        this.canvasWidth = boardWidth * cellWidth;
        this.canvasHeight = boardHeight * cellHeight;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.cellArray = [];
        this.canvasOffsetLeft = 0;
        this.canvasOffsetTop = 0;
        this.stopTimer = '';
        this.wasDrawing = false;
        this.drawingType = 'alive';
    }

    initializeCanvas() {
        console.log('init this b!tch!');
        const $mainCanvas = $('#canvasLife');
        const mainCanvas = document.getElementById('canvasLife');
        console.log($mainCanvas);
        this.canvasOffsetLeft = $mainCanvas[0].offsetLeft;
        console.log('left offset ', this.canvasOffsetLeft);
        this.canvasOffsetTop = $mainCanvas[0].offsetTop;
        console.log('top offset ', this.canvasOffsetTop);
        this.mainContext = $mainCanvas[0].getContext('2d');
        this.mainContext.canvas.height = this.canvasHeight;
        this.mainContext.canvas.width = this.canvasWidth;
        console.log('mc -- ', this.mainContext);
        console.log('Is the size set....?');

        /***
         * Comment this out for now, future be able to choose single click or draw mode
         */

        $mainCanvas.click((event) => {
            // console.log('Clicking on stuff....');
            // console.log('Event ', event);
            const x = event.pageX - this.canvasOffsetLeft;
            // console.log('x', x);
            const y = event.pageY - this.canvasOffsetTop;
            // console.log('y ', y);
            // loop through every block and see if its the one that was clicked
            this.cellArray.forEach((element, index) => {
                // console.log('Looping! ', element, index);

                // console.log('x ', x, ' pointX ', element.cellOrigin.pointX, ' x plus width ', element.cellOrigin.pointX + element.cellWidth);
                // console.log('y ', y, ' pointY ', element.cellOrigin.pointY, ' y plust height ', element.cellOrigin.pointY + element.cellHeight);
                if(y > element.cellOrigin.pointY && y < element.cellOrigin.pointY + element.cellHeight &&
                    x > element.cellOrigin.pointX &&  x < element.cellOrigin.pointX + element.cellWidth) {
                    console.log('Found one!', index);
                    // TODO: also need to check if its editable
                    if(this.cellArray[index].cellStatus === 'dead') {
                        this.cellArray[index].cellStatus = 'alive';
                    } else {
                        this.cellArray[index].cellStatus = 'dead';
                    }
                    console.log('Drawing? ', this.wasDrawing);
                    if(this.wasDrawing) {
                        this.wasDrawing = false;
                        // dont draw after the click but do draw next time
                        console.log('Dont draw');
                    } else {
                        console.log('Draw');
                        this.cellArray[index].drawCell(this.mainContext);
                    }
                }
            });
        });


        this.captureMouseEvents(mainCanvas);
    }

    captureMouseEvents(canvas) {
        console.log('Setup Capture');

        // this will capture all mousedown events from the canvas element
        rxjs.fromEvent(canvas, 'mousedown')
            .pipe(
                rxjs.operators.switchMap((e) => {
                    // after a mouse down, we'll record all mouse moves
                    return rxjs.fromEvent(canvas, 'mousemove')
                        .pipe(
                            // we'll stop (and unsubscribe) once the user releases the mouse
                            // this will trigger a 'mouseup' event
                            rxjs.operators.takeUntil(rxjs.fromEvent(canvas, 'mouseup')),
                            // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
                            rxjs.operators.takeUntil(rxjs.fromEvent(canvas, 'mouseleave')),
                            // pairwise lets us get the previous value to draw a line from
                            // the previous point to the current point
                            rxjs.operators.pairwise()
                        )
                })
            )
            .subscribe((res /*: [MouseEvent, MouseEvent]*/) => {

                console.log('Capture');
                this.wasDrawing = true;
                const rect = canvas.getBoundingClientRect();

                // previous and current position with the offset
                const prevPos = {
                    x: res[0].clientX - rect.left,
                    y: res[0].clientY - rect.top
                };

                const currentPos = {
                    x: res[1].clientX - rect.left,
                    y: res[1].clientY - rect.top
                };

                console.log('Prev -> ', prevPos, 'current -> ', currentPos);
                // this method we'll implement soon to do the actual drawing
                this.drawOnCanvas(currentPos);
            });

    }

    drawOnCanvas(currentPos) {
        console.log('Drawing on canvas');

        const x = currentPos.x;
        const y = currentPos.y;
        this.cellArray.forEach((element, index) => {
            // console.log('Looping! ', element, index);

            // console.log('x ', x, ' pointX ', element.cellOrigin.pointX, ' x plus width ', element.cellOrigin.pointX + element.cellWidth);
            // console.log('y ', y, ' pointY ', element.cellOrigin.pointY, ' y plust height ', element.cellOrigin.pointY + element.cellHeight);
            if(y > element.cellOrigin.pointY && y < element.cellOrigin.pointY + element.cellHeight &&
                x > element.cellOrigin.pointX &&  x < element.cellOrigin.pointX + element.cellWidth) {
                console.log('Found one!', index);

                /***
                 * For now going to make alive but in future check which type
                 */
                /*
                if(this.cellArray[index].cellStatus === 'dead') {
                    this.cellArray[index].cellStatus = 'alive';
                } else {
                    this.cellArray[index].cellStatus = 'dead';
                }
                */
                console.log('Drawing type ', this.drawingType);
                this.cellArray[index].cellStatus = this.drawingType;
                this.cellArray[index].drawCell(this.mainContext);
            }
        });
    }

    funny() {
        const testCell = new Cell(2, 50, 2, 50);
        testCell.drawCell(this.mainContext);
    }

    buildBoard() {
        const lastRow = this.boardHeight - 1;
        const top = this.boardWidth - 1;
        const bottom = (this.boardWidth * this.boardHeight) - 1;
        console.log('Should be 30 ', bottom);
        let currentColumn = 0;
        for(let index = 0; index <= bottom; index++) {
            console.log('Heyo! ', index);
            const row = Math.floor(index / this.boardWidth);
            console.log('Row', row);
            const leftEdge = row * this.boardWidth;
            console.log('Left edge ', leftEdge);
            const rightEdge = leftEdge + top;
            console.log('Right edge ', rightEdge);

            let tempCell = new Cell(currentColumn, this.cellWidth, row, this.cellHeight);

            if(index <= top) {
                tempCell.cellType = 'constant';
                tempCell.cellStatus = 'dead';
                tempCell.cellColor = 'black';
            } else if(index === leftEdge) {
                tempCell.cellType = 'constant';
                tempCell.cellStatus = 'dead';
                tempCell.cellColor = 'black';
            } else if(index === rightEdge) {
                tempCell.cellType = 'constant';
                tempCell.cellStatus = 'dead';
                tempCell.cellColor = 'black';
            } else if(row === lastRow) {
                tempCell.cellType = 'constant';
                tempCell.cellStatus = 'dead';
                tempCell.cellColor = 'black';
            }

            this.cellArray.push(tempCell);

            if(currentColumn < (this.boardWidth - 1)) {
                currentColumn++;
                console.log('Current Column ', currentColumn);
            } else {
                currentColumn = 0;
                console.log('Reset column to zero ', currentColumn);
            }
        }
        // set the middle for testing
        /*
        this.cellArray[6].cellStatus = 'alive';
        this.cellArray[11].cellStatus = 'alive';
        this.cellArray[12].cellStatus = 'alive';
        this.cellArray[17].cellStatus = 'alive';
        this.cellArray[18].cellStatus = 'alive';
        this.cellArray[19].cellStatus = 'alive';
        this.cellArray[20].cellStatus = 'alive';
        this.cellArray[21].cellStatus = 'alive';
        this.cellArray[22].cellStatus = 'alive';
        this.cellArray[23].cellStatus = 'alive';
        this.cellArray[24].cellStatus = 'alive';
        this.cellArray[25].cellStatus = 'alive';
        this.cellArray[26].cellStatus = 'alive';
        this.cellArray[27].cellStatus = 'alive';
        this.cellArray[28].cellStatus = 'alive';
        this.cellArray[29].cellStatus = 'alive';
        this.cellArray[30].cellStatus = 'alive';
        this.cellArray[31].cellStatus = 'alive';
        this.cellArray[32].cellStatus = 'alive';
        this.cellArray[33].cellStatus = 'alive';
        this.cellArray[34].cellStatus = 'alive';
        this.cellArray[35].cellStatus = 'alive';
        */
        this.drawBoard();
    }

    run() {
        this.nextTick();
        this.drawBoard();
        this.stopTimer = setTimeout(() => {this.run()}, 1000);
    }

    oneTick() {
        this.nextTick();
        this.drawBoard();
    }

    stop() {
        clearTimeout(this.stopTimer);
    }

    drawBoard() {
        // try to draw this fucking thing
        console.log('Drawing Board?');
        console.log(this.cellArray.length, this.cellArray);
        this.cellArray.forEach(element => {
            element.drawCell(this.mainContext);
        });
    }

    nextTick() {
        // need another array then flip arrays and draw
        const thisWidth = this.boardWidth;
        const thisHeight = this.boardHeight;
        const widthMinusOne = thisWidth - 1;
        const widthPlusOne = thisWidth + 1;

        // need to examine all 8 neibors unless they are static border
        // border is fair game to make custom rules
        let tempBoard = [];
        let printBoard = [...this.cellArray];
        console.log('Next tic, ', printBoard);
        this.cellArray.forEach((element, index, array) => {
            // tempBoard[index] = array[index];
            tempBoard[index] = new Cell();
            tempBoard[index].cloneCell(element);
            console.log('Element -> ', element);
            if(element.cellType === 'constant') {
                // do nothing for now
            } else if(element.cellType === 'dynamic') {
                // need to examine all eight neibors
                console.log('Dynamic');
                const n1 = index + 1;
                const n2 = index - 1;
                const n3 = index + widthPlusOne;
                const n4 = index + thisWidth;
                const n5 = index + widthMinusOne;
                const n6 = index - widthPlusOne;
                const n7 = index - thisWidth;
                const n8 = index - widthMinusOne;

                let numberNeighbors = 0;
                console.log('Cell ', index, ' N1-8: ', n1, n2, n3, n4, n5, n6, n7, n8);
                // debugger;
                if(array[n1].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                if(array[n2].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                if(array[n3].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                if(array[n4].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                if(array[n5].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                if(array[n6].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                if(array[n7].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                if(array[n8].cellStatus === 'alive') {
                    numberNeighbors++;
                }
                // to be continued...
                console.log('Number Neibors ', numberNeighbors);
                if(element.cellStatus === 'alive') {
                    if(numberNeighbors === 2 || numberNeighbors === 3) {
                        tempBoard[index].cellStatus = 'alive'; // should be the same?
                        // console.log('alive?', tempBoard[index].cellStatus, index);
                    } else {
                        tempBoard[index].cellStatus = 'dead'; // kill it!
                        // console.log('dead?', tempBoard[index].cellStatus, index);
                    }
                } else if (element.cellStatus === 'dead') {
                    if (numberNeighbors === 3) {
                        // im alive!!!
                        tempBoard[index].cellStatus = 'alive'; // not same -- oposite?
                        // console.log('regenerated?', tempBoard[index].cellStatus, index);
                    }
                }
            } else {
                // not sure what the happened
                console.log('Not dynamic or constant?');
            }
        });

        this.cellArray = tempBoard;
    }
}