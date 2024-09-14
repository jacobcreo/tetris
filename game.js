// game.js
$(document).ready(function() {
    const canvas = $('#game-canvas')[0];
    const context = canvas.getContext('2d');
    const nextCanvas = $('#next-canvas')[0];
    const nextContext = nextCanvas.getContext('2d');

    let gridWidth = 10;
    let gridHeight = 20;
    let blockSize = 30;
    let isPaused = false;
    let grid = [];
    let currentPiece;
    let nextPiece;
    let score = 0;
    let gameSpeed = 500; // Initial speed (milliseconds)
    let userSide = null; // 'democrat' or 'republican'
    let gameInterval;
    let gameOver = false;

    let politicianScoreCount = {}; // Keep track of score impact per politician
    let piecesSpawned = 0; // Keep track of how many pieces have been spawned
    let gameEnded = false; // Flag to ensure endGame() is called only once

    // Statistics variables
    let totalLinesCleared = 0;
    let demLinesCleared = 0;
    let repLinesCleared = 0;
    let demPiecesReleased = 0;
    let repPiecesReleased = 0;

    // Load sound effects
    const sounds = {
        move: new Audio('sounds/move.mp3'),
        rotate: new Audio('sounds/rotate.mp3'),
        lineClear: new Audio('sounds/line_clear.mp3'),
        gameOver: new Audio('sounds/game_over.mp3')
    };

    // Politician data with preloaded images
    const politicians = {
        democrat: [
            {
                name: 'Kamala Harris',
                party: 'Democrat',
                color: '#0074d9', // Updated colors to match new design
                imageSrc: 'images/kamala.png',
                image: new Image()
            },
            {
                name: 'Tim Walz',
                party: 'Democrat',
                color: '#0074d9',
                imageSrc: 'images/walz.png',
                image: new Image()
            },
            {
                name: 'Joe Biden',
                party: 'Democrat',
                color: '#0074d9',
                imageSrc: 'images/biden.png',
                image: new Image()
            },
            {
                name: 'Taylor Swift',
                party: 'Democrat',
                color: '#0074d9',
                imageSrc: 'images/taylor.png',
                image: new Image()
            },
            {
                name: 'Nancy Pelosi',
                party: 'Democrat',
                color: '#0074d9',
                imageSrc: 'images/pelosi.png',
                image: new Image()
            },
            {
                name: 'Beyoncé',
                party: 'Democrat',
                color: '#0074d9',
                imageSrc: 'images/beyonce.png',
                image: new Image()
            }
        ],
        republican: [
            {
                name: 'Donald Trump',
                party: 'Republican',
                color: '#ff4136',
                imageSrc: 'images/trump.png',
                image: new Image()
            },
            {
                name: 'JD Vance',
                party: 'Republican',
                color: '#ff4136',
                imageSrc: 'images/vance.png',
                image: new Image()
            },
            {
                name: 'Ted Cruz',
                party: 'Republican',
                color: '#ff4136',
                imageSrc: 'images/cruz.png',
                image: new Image()
            },
            {
                name: 'Elon Musk',
                party: 'Republican',
                color: '#ff4136',
                imageSrc: 'images/elon.png',
                image: new Image()
            },
            {
                name: 'Ben Shapiro',
                party: 'Republican',
                color: '#ff4136',
                imageSrc: 'images/shapiro.png',
                image: new Image()
            },
            {
                name: 'Kanye West',
                party: 'Republican',
                color: '#ff4136',
                imageSrc: 'images/kanye.png',
                image: new Image()
            }
        ]
    };

    // Preload images
    for (const side in politicians) {
        politicians[side].forEach(politician => {
            politician.image.src = politician.imageSrc;
        });
    }

    // Tetris shapes
    const shapes = [
        // I-shape
        [
            [1],
            [1],
            [1],
            [1]
        ],
        // O-shape
        [
            [1, 1],
            [1, 1]
        ],
        // T-shape
        [
            [0, 1, 0],
            [1, 1, 1]
        ],
        // S-shape
        [
            [0, 1, 1],
            [1, 1, 0]
        ],
        // Z-shape
        [
            [1, 1, 0],
            [0, 1, 1]
        ],
        // J-shape
        [
            [1, 0, 0],
            [1, 1, 1]
        ],
        // L-shape
        [
            [0, 0, 1],
            [1, 1, 1]
        ]
    ];

    // Announcements for scoring
    const positiveAnnouncements = [
        "You cleared a line for your side! +100 points!",
        "Allies unite! +100 points!",
        "Teamwork makes the dream work! +100 points!",
        "You’re stacking up victories! +100 points!",
        "Party loyalty pays off! +100 points!",
        "You're making your party proud! +100 points!",
        "Way to represent! +100 points!",
        "Victory is sweet! +100 points!",
        "You’re a true supporter! +100 points!",
        "Dominating the polls! +100 points!"
    ];

    const negativeAnnouncements = [
        "You cleared the opposition's line! -100 points!",
        "Oops, that helped the other side! -100 points!",
        "That move favored the other side! -100 points!",
        "Whoops! Wrong team! -100 points!",
        "You're crossing party lines! -100 points!",
        "The other side thanks you! -100 points!",
        "Not a good look! -100 points!",
        "Watch your loyalties! -100 points!",
        "Helping the opposition? -100 points!",
        "They owe you one! -100 points!"
    ];

    const bonusAnnouncements = [
        "Monolithic masterpiece! +300 bonus points!",
        "Unanimous support! +300 bonus points!",
        "A solid block of victory! +300 bonus points!",
        "Pure party power! +300 bonus points!",
        "An army of one! +300 bonus points!"
    ];

    const penaltyAnnouncements = [
        "Cleared a full line of opposition! -300 points!",
        "They’re celebrating thanks to you! -300 points!",
        "You just boosted their morale! -300 points!",
        "United they stand, and you helped! -300 points!",
        "That backfired! -300 points!"
    ];

    const multiLineAnnouncements = [
        "Double trouble! You cleared {lines} lines!",
        "Triple play! {lines} lines cleared!",
        "Combo breaker! {lines} lines vanished!",
        "Tetris master! {lines} lines cleared at once!",
        "You're on fire! {lines} lines down!"
    ];

    const shareMessages = [
        "Just scored {score} points in Politician Tetris! {side} all the way!",
        "I rocked Politician Tetris with {score} points for the {side}s!",
        "{side} pride! Scored {score} points in Politician Tetris!",
        "Unstoppable! {score} points for the {side}s in Politician Tetris!",
        "Can you beat my {score} points in Politician Tetris? {side}s rule!"
    ];

    // Hide the game container initially
    $('#game-container').hide();

    // Event handler for closing the instructions modal
    $('.close-button').click(function() {
        $('#instructions-modal').hide();
        $('#side-selection').show();
        $('#game-container').show();
        resizeCanvas();
    });

    // Event handler for the start game button
    $('#start-game-button').click(function() {
        $('#instructions-modal').hide();
        $('#side-selection').show();
        $('#game-container').show();
        resizeCanvas();
    });

    // Side selection
    $('#democrat-button').click(function() {
        userSide = 'democrat';
        $('#user-side-text').text('Democrat');
        $('#user-side-color').text('blue');
        $('#user-side-color').css('color', '#0074d9');
        $('#side-selection').hide();
        $('#game-canvas').show();
        $('#score-board').show();
        $('#pause-button').show();
        $('#leaderboard').show();
        $('#user-side-display').show();
        resizeCanvas();
        startGame();
    });

    $('#republican-button').click(function() {
        userSide = 'republican';
        $('#user-side-text').text('Republican');
        $('#user-side-color').text('red');
        $('#user-side-color').css('color', '#ff4136');
        $('#side-selection').hide();
        $('#game-canvas').show();
        $('#score-board').show();
        $('#pause-button').show();
        $('#leaderboard').show();
        $('#user-side-display').show();
        resizeCanvas();
        startGame();
    });

    function startGame() {
        // Reset flags and counters
        score = 0;
        updateScore();
        politicianScoreCount = {};
        $('#announcement').text('');
        gameOver = false;
        gameEnded = false;
        piecesSpawned = 0;

        // Reset statistics
        totalLinesCleared = 0;
        demLinesCleared = 0;
        repLinesCleared = 0;
        demPiecesReleased = 0;
        repPiecesReleased = 0;
        updateStatistics();

        // Initialize grid
        grid = [];
        for (let row = 0; row < gridHeight; row++) {
            grid[row] = [];
            for (let col = 0; col < gridWidth; col++) {
                grid[row][col] = null;
            }
        }

        // Generate next piece
        nextPiece = generateRandomPiece();

        // Spawn the first piece
        spawnPiece();

        // Start game loop
        clearInterval(gameInterval); // Clear any existing intervals
        gameInterval = setInterval(gameLoop, gameSpeed);

        // Listen for keyboard inputs
        $(document).on('keydown', handleInput);

        // Prevent scrolling on key presses
        window.addEventListener('keydown', preventScroll, false);

        // Initialize touch controls
        initTouchControls();
    }

    function preventScroll(e) {
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }

    function generateRandomPiece() {
        // Choose a random side
        const sides = ['democrat', 'republican'];
        const side = sides[Math.floor(Math.random() * sides.length)];

        // Update pieces released statistics
        if (side === 'democrat') {
            demPiecesReleased++;
        } else {
            repPiecesReleased++;
        }
        updateStatistics();

        // Determine available politicians based on pieces spawned
        let availablePoliticians = getAvailablePoliticians();

        // Choose a random politician from the side
        const politicianList = availablePoliticians[side];
        const politician = politicianList[Math.floor(Math.random() * politicianList.length)];

        // Choose a random shape
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        // Create the piece
        const piece = {
            x: Math.floor(gridWidth / 2) - Math.ceil(shape[0].length / 2),
            y: 0,
            shape: shape,
            politician: politician,
            side: side
        };

        return piece;
    }

    function getAvailablePoliticians() {
        const maxPieces = piecesSpawned;

        const democratPoliticians = [];
        const republicanPoliticians = [];

        if (maxPieces <= 10) {
            // First 10 pieces: Kamala Harris (Democrat) and Donald Trump (Republican)
            democratPoliticians.push(politicians.democrat.find(p => p.name === 'Kamala Harris'));
            republicanPoliticians.push(politicians.republican.find(p => p.name === 'Donald Trump'));
        } else if (maxPieces <= 15) {
            // Next 5 pieces: Add Tim Walz and JD Vance
            democratPoliticians.push(...politicians.democrat.filter(p => ['Kamala Harris', 'Tim Walz'].includes(p.name)));
            republicanPoliticians.push(...politicians.republican.filter(p => ['Donald Trump', 'JD Vance'].includes(p.name)));
        } else if (maxPieces <= 20) {
            // Next 5 pieces: Add Joe Biden and Ted Cruz
            democratPoliticians.push(...politicians.democrat.filter(p => ['Kamala Harris', 'Tim Walz', 'Joe Biden'].includes(p.name)));
            republicanPoliticians.push(...politicians.republican.filter(p => ['Donald Trump', 'JD Vance', 'Ted Cruz'].includes(p.name)));
        } else if (maxPieces <=25) {
            // Next 5 pieces: Add Taylor Swift and Elon Musk
            democratPoliticians.push(...politicians.democrat.filter(p => ['Kamala Harris', 'Tim Walz', 'Joe Biden', 'Taylor Swift'].includes(p.name)));
            republicanPoliticians.push(...politicians.republican.filter(p => ['Donald Trump', 'JD Vance', 'Ted Cruz', 'Elon Musk'].includes(p.name)));
        } else if (maxPieces <=30) {
            // Next 5 pieces: Add Nancy Pelosi and Ben Shapiro
            democratPoliticians.push(...politicians.democrat.filter(p => ['Kamala Harris', 'Tim Walz', 'Joe Biden', 'Taylor Swift', 'Nancy Pelosi'].includes(p.name)));
            republicanPoliticians.push(...politicians.republican.filter(p => ['Donald Trump', 'JD Vance', 'Ted Cruz', 'Elon Musk', 'Ben Shapiro'].includes(p.name)));
        } else {
            // Next pieces: Add Beyoncé and Kanye West
            democratPoliticians.push(...politicians.democrat);
            republicanPoliticians.push(...politicians.republican);
        }

        // Remove any undefined entries (in case a politician is not found)
        return {
            democrat: democratPoliticians.filter(p => p !== undefined),
            republican: republicanPoliticians.filter(p => p !== undefined)
        };
    }

    function spawnPiece() {
        // Increment piecesSpawned when a new piece is spawned
        piecesSpawned++;

        // Set current piece to next piece
        currentPiece = nextPiece;

        // Update the current politician display
        updateCurrentPoliticianDisplay(currentPiece.politician);

        // Generate a new next piece
        nextPiece = generateRandomPiece();

        // Update the next piece display
        updateNextPieceDisplay(nextPiece);
    }

    function updateCurrentPoliticianDisplay(politician) {
        $('#politician-image').attr('src', politician.imageSrc);
        $('#politician-name').text(politician.name);
        $('#politician-party').text('Party: ' + politician.party);
    }

    function updateNextPieceDisplay(piece) {
        // Clear the next piece canvas
        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

        // Calculate block size for next piece canvas
        const nextBlockSize = nextCanvas.width / 4;

        // Draw the shape
        const shape = piece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    nextContext.fillStyle = piece.politician.color;
                    nextContext.fillRect(
                        col * nextBlockSize,
                        row * nextBlockSize,
                        nextBlockSize,
                        nextBlockSize
                    );
                    // Draw image inside the block
                    if (piece.politician.image.complete) {
                        nextContext.drawImage(
                            piece.politician.image,
                            col * nextBlockSize,
                            row * nextBlockSize,
                            nextBlockSize,
                            nextBlockSize
                        );
                    }
                }
            }
        }

        // Update next politician info
        $('#next-politician-image').attr('src', piece.politician.imageSrc);
        $('#next-politician-name').text(piece.politician.name);
        $('#next-politician-party').text('Party: ' + piece.politician.party);
    }

    function gameLoop() {
        if (gameOver) {
            if (!gameEnded) {
                clearInterval(gameInterval);
                endGame();
                gameEnded = true; // Ensure endGame() is called only once
            }
            return;
        }
        if (!isPaused) {
            movePieceDown();
            draw();
        }
    }

    function movePieceDown() {
        currentPiece.y += 1;
        if (checkCollision()) {
            currentPiece.y -= 1;
            mergePiece();
            clearLines();
            spawnPiece();
            if (checkCollision()) {
                gameOver = true;
            }
        }
    }

    function checkCollision() {
        const { x, y, shape } = currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    let newX = x + col;
                    let newY = y + row;
                    if (
                        newX < 0 ||
                        newX >= gridWidth ||
                        newY >= gridHeight ||
                        (grid[newY] && grid[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function mergePiece() {
        const { x, y, shape, politician, side } = currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    let gridX = x + col;
                    let gridY = y + row;
                    grid[gridY][gridX] = {
                        politician: politician,
                        side: side
                    };
                }
            }
        }
    }

    function clearLines() {
        let linesCleared = 0;
        let messages = [];

        for (let row = gridHeight - 1; row >= 0; row--) {
            if (grid[row].every(cell => cell !== null)) {
                linesCleared++;

                // Count sides and politicians
                let sideCount = { democrat: 0, republican: 0 };
                let politicianCount = {};
                for (let col = 0; col < gridWidth; col++) {
                    const cell = grid[row][col];
                    sideCount[cell.side]++;
                    const politicianName = cell.politician.name;
                    if (politicianCount[politicianName]) {
                        politicianCount[politicianName]++;
                    } else {
                        politicianCount[politicianName] = 1;
                    }

                    // Update politician score count
                    if (politicianScoreCount[politicianName]) {
                        politicianScoreCount[politicianName] += 0; // No score change here
                    } else {
                        politicianScoreCount[politicianName] = 0;
                    }
                }

                // Determine if all blocks are from the same politician
                const politicianNames = Object.keys(politicianCount);
                const isSamePolitician = politicianNames.length === 1;

                // Update score and collect messages
                let pointsChanged = 0;
                if (isSamePolitician) {
                    const politicianInvolved = politicianNames[0];
                    if (politicians[userSide].some(p => p.name === politicianInvolved)) {
                        score += 300; // Bonus points
                        pointsChanged = 300;
                        messages.push(getRandomElement(bonusAnnouncements));
                    } else {
                        score -= 300; // Penalty points
                        pointsChanged = -300;
                        messages.push(getRandomElement(penaltyAnnouncements));
                    }
                } else if (sideCount[userSide] > sideCount[getOppositeSide(userSide)]) {
                    score += 100;
                    pointsChanged = 100;
                    messages.push(getRandomElement(positiveAnnouncements));
                } else {
                    score -= 100;
                    pointsChanged = -100;
                    messages.push(getRandomElement(negativeAnnouncements));
                }

                // Update politician score count
                for (let polName in politicianCount) {
                    if (politicianScoreCount[polName]) {
                        politicianScoreCount[polName] += pointsChanged / Object.keys(politicianCount).length;
                    } else {
                        politicianScoreCount[polName] = pointsChanged / Object.keys(politicianCount).length;
                    }
                }

                // Update lines cleared statistics
                totalLinesCleared++;
                if (sideCount['democrat'] > sideCount['republican']) {
                    demLinesCleared++;
                } else if (sideCount['republican'] > sideCount['democrat']) {
                    repLinesCleared++;
                }
                updateStatistics();

                // Remove the completed row
                grid.splice(row, 1);
                // Add a new empty row at the top
                grid.unshift(Array(gridWidth).fill(null));

                // Check the same row again
                row++;
            }
        }
        if (linesCleared > 0) {
            sounds.lineClear.play();

            // Display messages
            if (linesCleared > 1) {
                const multiLineMessage = getRandomElement(multiLineAnnouncements).replace('{lines}', linesCleared);
                messages.unshift(multiLineMessage);
            }
            $('#announcement').html(messages.join('<br>'));
            updateScore();
        }
    }

    function getOppositeSide(side) {
        return side === 'democrat' ? 'republican' : 'democrat';
    }

    function getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    function updateScore() {
        $('#score-board').text('Score: ' + score);
    }

    function updateStatistics() {
        $('#total-lines-cleared').text(totalLinesCleared);
        $('#dem-lines-cleared').text(demLinesCleared);
        $('#rep-lines-cleared').text(repLinesCleared);
        $('#dem-pieces-released').text(demPiecesReleased);
        $('#rep-pieces-released').text(repPiecesReleased);
    }

    function handleInput(e) {
        switch(e.keyCode) {
            case 37: // Left arrow
                movePiece(-1);
                break;
            case 39: // Right arrow
                movePiece(1);
                break;
            case 40: // Down arrow
                movePieceDown();
                break;
            case 38: // Up arrow
                rotatePiece();
                break;
            case 80: // 'P' key
                togglePause();
                break;
        }
    }

    function movePiece(direction) {
        currentPiece.x += direction;
        if (checkCollision()) {
            currentPiece.x -= direction;
        } else {
            sounds.move.play();
        }
    }

    function rotatePiece() {
        const shape = currentPiece.shape;
        const rotatedShape = [];

        for (let col = 0; col < shape[0].length; col++) {
            rotatedShape[col] = [];
            for (let row = shape.length - 1; row >= 0; row--) {
                rotatedShape[col][shape.length - 1 - row] = shape[row][col];
            }
        }

        const oldShape = currentPiece.shape;
        currentPiece.shape = rotatedShape;

        if (checkCollision()) {
            currentPiece.shape = oldShape;
        } else {
            sounds.rotate.play();
        }
    }

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                if (grid[row][col]) {
                    drawCell(col, row, grid[row][col].politician);
                }
            }
        }

        // Draw current piece
        const { x, y, shape, politician } = currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    drawCell(x + col, y + row, politician);
                }
            }
        }
    }

    function drawCell(x, y, politician) {
        context.fillStyle = politician.color;
        context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

        if (politician.image.complete) {
            context.drawImage(
                politician.image,
                x * blockSize,
                y * blockSize,
                blockSize,
                blockSize
            );
        } else {
            politician.image.onload = function() {
                context.drawImage(
                    politician.image,
                    x * blockSize,
                    y * blockSize,
                    blockSize,
                    blockSize
                );
            };
        }
    }

    function endGame() {
        sounds.gameOver.play();

        // Remove keydown event listener
        $(document).off('keydown', handleInput);
        window.removeEventListener('keydown', preventScroll);

        // Remove touch controls
        removeTouchControls();

        // Determine the politician who affected the score the most
        let maxImpact = 0;
        let impactfulPolitician = null;
        for (let name in politicianScoreCount) {
            let impact = politicianScoreCount[name];
            if (Math.abs(impact) > Math.abs(maxImpact)) {
                maxImpact = impact;
                impactfulPolitician = name;
            }
        }

        // Get the politician's image source
        let politicianImageSrc = '';
        if (impactfulPolitician) {
            for (let side in politicians) {
                let pol = politicians[side].find(p => p.name === impactfulPolitician);
                if (pol) {
                    politicianImageSrc = pol.imageSrc;
                    break;
                }
            }
        }

        // Prepare the share message
        let shareMessageTemplate = getRandomElement(shareMessages);
        let shareMessage = shareMessageTemplate.replace('{score}', score)
            .replace('{side}', capitalizeFirstLetter(userSide));

        // Update the game over modal
        $('#final-score').text('Your final score is ' + score);
        $('#impactful-politician-image').attr('src', politicianImageSrc);
        $('#impactful-politician-name').text('Most impactful: ' + impactfulPolitician);

        // Check if this is a new high score
        let highScore = getHighScore();
        let recordMessage = '';
        if (score > highScore) {
            recordMessage = 'Congratulations! You beat your previous high score!';
            saveHighScore(score);
        } else {
            recordMessage = 'Your highest score is ' + highScore;
        }
        $('#record-message').text(recordMessage);

        // Show game over modal
        $('#game-over-modal').show();

        // Update share button
        $('#share-button-modal').off('click'); // Remove previous click handlers
        $('#share-button-modal').click(function() {
            const tweetText = encodeURIComponent(shareMessage);
            const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
            window.open(tweetUrl, '_blank');
        });

        // Play again button
        $('#play-again-button').off('click'); // Remove previous click handlers
        $('#play-again-button').click(function() {
            $('#game-over-modal').hide();
            startGame();
        });
    }

    function getHighScore() {
        let highScore = parseInt(localStorage.getItem('politicianTetrisHighScore')) || 0;
        return highScore;
    }

    function saveHighScore(newScore) {
        localStorage.setItem('politicianTetrisHighScore', newScore);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Update leaderboard
    function updateLeaderboard() {
        let scores = JSON.parse(localStorage.getItem('politicianTetrisScores')) || [];
        $('#leaderboard-list').empty();
        scores.forEach(function(score) {
            $('#leaderboard-list').append('<li>' + score + '</li>');
        });
    }

    function togglePause() {
        isPaused = !isPaused;
        $('#pause-button').html(isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause');
    }

    $('#pause-button').click(function() {
        togglePause();
    });

    function increaseGameSpeed() {
        if (gameSpeed > 200) {
            gameSpeed -= 50;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }

    // Increase speed every 60 seconds
    setInterval(increaseGameSpeed, 60000);

    // Load saved score and update leaderboard on document ready
    updateLeaderboard();

    // Resize canvas function
    function resizeCanvas() {
        const canvasContainer = document.getElementById('canvas-container');
        const width = canvasContainer.clientWidth;
        const height = (gridHeight / gridWidth) * width;
        canvas.width = width;
        canvas.height = height;
        blockSize = width / gridWidth;
    }

    window.addEventListener('resize', resizeCanvas);

    // Touch Controls using Hammer.js
    let mc; // Hammer manager

    function initTouchControls() {
        mc = new Hammer.Manager(canvas);

        let Swipe = new Hammer.Swipe();
        let Tap = new Hammer.Tap();

        mc.add(Swipe);
        mc.add(Tap);

        mc.on('swipeleft', function() {
            movePiece(-1);
        });

        mc.on('swiperight', function() {
            movePiece(1);
        });

        mc.on('swipedown', function() {
            movePieceDown();
        });

        mc.on('tap', function() {
            rotatePiece();
        });
    }

    function removeTouchControls() {
        if (mc) {
            mc.destroy();
            mc = null;
        }
    }
});
