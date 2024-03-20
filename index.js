var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Detector = Matter.Detector,
    Events = Matter.Events,
    Composite = Matter.Composite,
    Vector = Matter.Vector;

let GAME = {
  engine: null,
  detector: null,
  canvas: null,
  ctx: null,
  mouse: {
    x: null,
    y: null
  },
  world: null,
  level: 0,
  player: null,
  lives: 3,
  totalJumps: 0,
  power: 0,
  isChargingPower: false,
  powerMeterDirection: 1,

  initialize() {
    GAME.engine = Engine.create();
    GAME.detector = Detector.create();

    GAME.canvas = document.createElement('canvas');
    GAME.canvas.setAttribute("id", "canvas");
    GAME.canvas.setAttribute("width", "1024px");
    GAME.canvas.setAttribute("height", "768px");
    document.body.appendChild(GAME.canvas);
    
    GAME.ctx = GAME.canvas.getContext('2d');

    GAME.canvas.addEventListener('mousemove', e => {
      GAME.mouse.x = e.offsetX;
      GAME.mouse.y = e.offsetY;
    });

    GAME.canvas.addEventListener('mousedown', () => {
      if (GAME.player && Body.getSpeed(GAME.player) <= 0.001 && GAME.mouse.x && GAME.mouse.y)
        GAME.isChargingPower = !GAME.isChargingPower;
    });

    GAME.canvas.addEventListener('mouseup', () => {
      if (GAME.player && GAME.isChargingPower && Body.getSpeed(GAME.player) <= 0.001 && GAME.mouse.x && GAME.mouse.y)
        GAME.applyJump()
    });

    Events.on(GAME.engine, 'collisionStart', (e) => {
      for (i = 0; i < e.pairs.length; i++) {
        const { bodyA, bodyB } = e.pairs[i];
        // Sticky wall check
        if (bodyA.label !== bodyB.label && (bodyA.label === "Player" || bodyA.label === "Sticky Wall") && (bodyB.label === "Player" || bodyB.label === "Sticky Wall")) {
          GAME.engine.gravity.scale = 0;
          Body.setSpeed(GAME.player, 0);
        }
        // Enemy check
        if (bodyA.label !== bodyB.label && (bodyA.label === "Player" || bodyA.label === "Enemy") && (bodyB.label === "Player" || bodyB.label === "Enemy")) {
          if (GAME.lives > 1) {
            GAME.lives -= 1;
            GAME.loadLevel(GAME.level);
          }
          else {
            GAME.lives = 3;
            GAME.totalJumps = 0;
            GAME.loadLevel(-1);
          }
        }
        // Exit check
        if (bodyA.label !== bodyB.label && (bodyA.label === "Player" || bodyA.label === "Exit") && (bodyB.label === "Player" || bodyB.label === "Exit")) {
          if (GAME.level === 8)
            GAME.loadLevel(0);
          else
            GAME.loadLevel(GAME.level + 1);
        }
      }
    });
    
    Events.on(GAME.engine, 'collisionEnd', (e) => {
      for (i = 0; i < e.pairs.length; i++) {
        const { bodyA, bodyB } = e.pairs[i];
        // Sticky wall check
        if (bodyA.label !== bodyB.label && (bodyA.label === "Player" || bodyA.label === "Sticky Wall") && (bodyB.label === "Player" || bodyB.label === "Sticky Wall")) {
          GAME.engine.gravity.scale = 0.001;
        }
      }
    });

    GAME.loadLevel(GAME.level);

    GAME.loop();
  },

  loop() {
    // Charge power if mouse down
    if (GAME.isChargingPower) {
      GAME.power += GAME.powerMeterDirection;

      if (GAME.power >= 100 || GAME.power <= 0)
        GAME.powerMeterDirection = -GAME.powerMeterDirection;
    }

    // ask for draw
    GAME.draw();

    window.requestAnimationFrame(GAME.loop);
    Engine.update(GAME.engine, 1000 / 60);
  },

  draw() {
    // clear the canvas
    GAME.ctx.clearRect(0, 0, GAME.canvas.width, GAME.canvas.height);
    GAME.ctx.fillStyle = '#fff';
    GAME.ctx.fillRect(0, 0, canvas.width, canvas.height);
    // iterate over bodies and fixtures
    const bodies = Composite.allBodies(GAME.engine.world);

    bodies.forEach(body => {
      GAME.ctx.strokeStyle = body.render.strokeStyle;
      GAME.ctx.fillStyle = body.render.fillStyle;
      GAME.ctx.lineWidth = body.render.lineWidth;
      GAME.ctx.globalAlpha = body.render.opacity;

      GAME.ctx.beginPath();

      const vertices = body.vertices;
      vertices.forEach((vertice, i) => {
        if (i === 0)
          GAME.ctx.moveTo(vertice.x, vertice.y);
        else
          GAME.ctx.lineTo(vertice.x, vertice.y);
      });
      GAME.ctx.lineTo(vertices[0].x, vertices[0].y);

      GAME.ctx.fill();
      GAME.ctx.globalAlpha = 1;
      GAME.ctx.stroke();
    })

    // Special level text
    GAME.ctx.fillStyle = '#00F';
    GAME.ctx.strokeStyle = '#00F';
    GAME.ctx.font = "20px arial";
    switch (GAME.level) {
      case -1:
        GAME.ctx.strokeText('TITLE', 242, 540);
        break;
      case 0:
        GAME.ctx.strokeText('START', 242, 540);
        GAME.ctx.fillStyle = '#080';
        GAME.ctx.strokeStyle = '#080';
        GAME.ctx.strokeText(`HOLD CLICK TO`, 650, 450);
        GAME.ctx.strokeText(`GET JUMP POWER`, 635, 480);
        GAME.ctx.strokeText(`&`, 725, 510);
        GAME.ctx.strokeText(`RELEASE TO JUMP`, 635, 540);
        GAME.ctx.fillStyle = '#800';
        GAME.ctx.strokeStyle = '#800';
        GAME.ctx.strokeText(`AVOID RED BLOCKS`, 630, 590);
        GAME.ctx.fillStyle = '#880';
        GAME.ctx.strokeStyle = '#880';
        GAME.ctx.strokeText(`STICK TO YELLOW BLOCKS`, 590, 640);
        GAME.ctx.strokeText(`AND JUMP AGAIN`, 640, 670);
        GAME.ctx.fillStyle = '#008';
        GAME.ctx.strokeStyle = '#008';
        GAME.ctx.strokeText(`REACH BLUE BLOCKS`, 170, 450);
        break;
      case 8:
        GAME.ctx.strokeText('TITLE', 242, 540);
        GAME.ctx.fillStyle = '#080';
        GAME.ctx.strokeStyle = '#080';
        GAME.ctx.strokeText(`TOTAL JUMPS : ${GAME.totalJumps}`, 430, 325);
        break;
      default :
        GAME.ctx.strokeText(`LEVEL ${GAME.level}`, 460, 37);
        break;
    }

    if (GAME.player) {
      // draw lives
      if (GAME.level !== -1 && GAME.level !== 0) {
        GAME.ctx.fillStyle = '#F00';
        GAME.ctx.strokeStyle = '#F00';
        GAME.ctx.font = "20px arial";
        GAME.ctx.strokeText('LIVES', 20, 37);
        GAME.ctx.fillStyle = '#0C0',
        GAME.ctx.globalAlpha = 0.5;
        for (i = 0; i < GAME.lives; i++) {
          GAME.ctx.beginPath();
          GAME.ctx.rect((90 + (i * 30)), 20, 21, 21);
          GAME.ctx.fill();
        }
        GAME.ctx.globalAlpha = 1;
      }

      // draw power
      GAME.ctx.beginPath();
      GAME.ctx.fillStyle = '#F00';
      GAME.ctx.strokeStyle = '#F00';
      GAME.ctx.font = "20px arial";
      GAME.ctx.strokeText('POWER', 930, 37);
      GAME.ctx.strokeStyle = '#000';
      GAME.ctx.rect(920, 20, -200, 21);
      GAME.ctx.stroke();
      GAME.ctx.beginPath();
      if (GAME.power >= 66)
        GAME.ctx.fillStyle = '#0F0';
      else if (GAME.power >= 33)
        GAME.ctx.fillStyle = '#FF0';
      GAME.ctx.rect(920, 20, -GAME.power*2, 21);
      GAME.ctx.fill();

    // draw aim line
    if (Body.getSpeed(GAME.player) <= 0.001 && GAME.mouse.x && GAME.mouse.y) {
      let playerPos = GAME.player.position;
      GAME.ctx.strokeStyle = "red";
      GAME.ctx.beginPath();
      GAME.ctx.moveTo(playerPos.x, playerPos.y);
      GAME.ctx.lineTo(GAME.mouse.x, GAME.mouse.y);
      GAME.ctx.stroke();
    }
    }
  },

  applyJump() {
    if (GAME.isChargingPower && GAME.player) {
      let playerPos = GAME.player.position;
      let angle = Math.atan2(GAME.mouse.y - (playerPos.y), GAME.mouse.x - (playerPos.x));
      let vector = Vector.create((Math.cos(angle)/100) * GAME.power/2, (Math.sin(angle)/100) * GAME.power/2);
      Body.applyForce(GAME.player, GAME.player.position, vector);
      if (GAME.level > 0 && GAME.level !== 8)
        GAME.totalJumps += 1;
    }
    GAME.isChargingPower = !GAME.isChargingPower;
    GAME.power = 0;
  },

  createWall(x, y, width, height, angle) {
    return Bodies.rectangle(x, y, width, height, {
      label: "Wall",
      angle : angle ? angle * (Math.PI / 180) : 0,
      isStatic: true,
      collisionFilter: {
        group: -1
      },
      render: {
        strokeStyle: '#000',
        lineWidth: 2,
        fillStyle: '#888',
        opacity: 0.5
      }
    });
  },

  createStickyWall(x, y, width, height, angle) {
    return Bodies.rectangle(x, y, width, height, {
      label: "Sticky Wall",
      angle : angle ? angle * (Math.PI / 180) : 0,
      isStatic: true,
      collisionFilter: {
        group: -1
      },
      render: {
        strokeStyle: '#880',
        lineWidth: 2,
        fillStyle: '#CC0',
        opacity: 0.5
      }
    });
  },

  createEnemy(x, y, width, height) {
    return Bodies.rectangle(x, y, width, height, {
      label: "Enemy",
      isStatic: true,
      isSensor: true,
      collisionFilter: {
        group: 1
      },
      render: {
        strokeStyle: '#800',
        lineWidth: 2,
        fillStyle: '#F00',
        opacity: 0.5
      }
    });
  },

  createExit(x, y, width, height) {
    return Bodies.rectangle(x, y, width, height, {
      label: "Exit",
      isStatic: true,
      isSensor: true,
      collisionFilter: {
        group: 1
      },
      render: {
        strokeStyle: '#00F',
        lineWidth: 2,
        fillStyle: '#00A',
        opacity: 0.5
      }
    });
  },

  createPlayer(x, y) {
    return Bodies.rectangle(x, y, 80, 80, {
      label: "Player",
      inertia: Infinity,
      collisionFilter: {
        group: 1
      },
      render: {
        strokeStyle: '#0F0',
        lineWidth: 2,
        fillStyle: '#0A0',
        opacity: 0.5
      }
    });
  },

  loadLevel(level) {
    GAME.level = level;
    let entities = [];

    GAME.player = null;
    Composite.clear(GAME.engine.world);
    Detector.clear(GAME.detector);

    switch (level) {
      // Game Over
      case -1 :
        GAME.player = GAME.createPlayer(512, 640);
        entities = [GAME.player,
          // Game over writing
          //  G
          GAME.createWall(70, 150, 100, 20),
          GAME.createWall(30, 200, 20, 120),
          GAME.createWall(70, 250, 100, 20),
          GAME.createWall(110, 225, 20, 70),
          GAME.createWall(95, 200, 50, 20),
          //  A
          GAME.createWall(195, 150, 100, 20),
          GAME.createWall(155, 200, 20, 120),
          GAME.createWall(235, 200, 20, 120),
          GAME.createWall(195, 200, 60, 20),
          //  M
          GAME.createWall(280, 200, 20, 120),
          GAME.createWall(360, 200, 20, 120),
          GAME.createWall(302, 175, 20, 70, -45),
          GAME.createWall(338, 175, 20, 70, 45),
          //  E
          GAME.createWall(445, 150, 100, 20),
          GAME.createWall(405, 200, 20, 120),
          GAME.createWall(440, 200, 50, 20),
          GAME.createWall(445, 250, 100, 20),
          //  O
          GAME.createWall(570, 150, 100, 20),
          GAME.createWall(530, 200, 20, 120),
          GAME.createWall(610, 200, 20, 120),
          GAME.createWall(570, 250, 100, 20),
          //  V
          GAME.createWall(675, 200, 125, 20, 70),
          GAME.createWall(715, 200, 125, 20, -70),
          //  E
          GAME.createWall(820, 150, 100, 20),
          GAME.createWall(780, 200, 20, 120),
          GAME.createWall(815, 200, 50, 20),
          GAME.createWall(820, 250, 100, 20),
          //  R
          GAME.createWall(945, 150, 100, 20),
          GAME.createWall(905, 200, 20, 120),
          GAME.createWall(985, 175, 20, 70),
          GAME.createWall(945, 200, 100, 20),
          GAME.createWall(950, 230, 100, 20, 30),
          // Player container
          GAME.createWall(512, 700, 800, 40),
          GAME.createWall(512, 400, 800, 40),
          GAME.createWall(132, 550, 40, 260),
          GAME.createWall(892, 550, 40, 260),
          // Exit
          GAME.createExit(275, 600, 80, 80)
        ];
        break
      // Title screen
      case 0 :
        GAME.player = GAME.createPlayer(512, 640);
        entities = [GAME.player, 
          //  R
          GAME.createWall(135, 150, 100, 20),
          GAME.createWall(95, 200, 20, 120),
          GAME.createWall(175, 175, 20, 70),
          GAME.createWall(135, 200, 100, 20),
          GAME.createWall(140, 230, 100, 20, 30),
          //  A
          GAME.createWall(260, 150, 100, 20),
          GAME.createWall(220, 200, 20, 120),
          GAME.createWall(300, 200, 20, 120),
          GAME.createWall(260, 200, 60, 20),
          //  N
          GAME.createWall(385, 200, 140, 20, 50),
          GAME.createWall(345, 200, 20, 120),
          GAME.createWall(425, 200, 20, 120),
          //  I
          GAME.createWall(510, 150, 100, 20),
          GAME.createWall(510, 200, 20, 120),
          GAME.createWall(510, 250, 100, 20),
          //  D
          GAME.createWall(625, 150, 80, 20),
          GAME.createWall(625, 250, 80, 20),
          GAME.createWall(595, 200, 20, 120),
          GAME.createWall(665, 200, 20, 90),
          //  A
          GAME.createWall(760, 150, 100, 20),
          GAME.createWall(720, 200, 20, 120),
          GAME.createWall(800, 200, 20, 120),
          GAME.createWall(760, 200, 60, 20),
          //  E
          GAME.createWall(885, 150, 100, 20),
          GAME.createWall(845, 200, 20, 120),
          GAME.createWall(880, 200, 50, 20),
          GAME.createWall(885, 250, 100, 20),
          // Player container
          GAME.createWall(512, 700, 800, 40),
          GAME.createWall(512, 400, 800, 40),
          GAME.createWall(132, 550, 40, 260),
          GAME.createWall(892, 550, 40, 260),
          // Exit
          GAME.createExit(275, 600, 80, 80)
        ];
        break;
      // Level 1
      case 1 :
        GAME.player = GAME.createPlayer(150, 600);
        entities = [GAME.player,
          // Walls
          GAME.createWall(512, 737, 1024, 60),
          GAME.createWall(31, 412, 60, 710),
          GAME.createWall(993, 412, 60, 710),
          GAME.createWall(512, 87, 1024, 60),
          GAME.createWall(500, 657, 100, 100),
          // Exit
          GAME.createExit(850, 657, 100, 100)
        ];
        break;
      // Level 2
      case 2 :
        GAME.player = GAME.createPlayer(150, 600);
        entities = [GAME.player,
          // Walls
          GAME.createWall(512, 737, 1024, 60),
          GAME.createWall(31, 412, 60, 710),
          GAME.createWall(993, 412, 60, 710),
          GAME.createWall(512, 87, 1024, 60),
          // Enemies
          GAME.createEnemy(500, 657, 100, 100),
          // Exit
          GAME.createExit(850, 657, 100, 100)
        ];
        break;
      // Level 3
      case 3 :
        GAME.player = GAME.createPlayer(150, 600);
        entities = [GAME.player,
          // Walls
          GAME.createWall(512, 737, 1024, 60),
          GAME.createWall(31, 412, 60, 710),
          GAME.createWall(993, 412, 60, 710),
          GAME.createWall(512, 87, 1024, 60),
          GAME.createWall(500, 507, 100, 400),
          GAME.createWall(136, 500, 150, 20),
          GAME.createWall(375, 317, 150, 20),
          GAME.createWall(625, 317, 150, 20),
          GAME.createWall(888, 500, 150, 20),
          // Enemies
          GAME.createEnemy(500, 299, 50, 15),
          // Exit
          GAME.createExit(890, 657, 100, 100)
        ];
        break;
      // Level 4
      case 4 :
        GAME.player = GAME.createPlayer(150, 600);
        entities = [GAME.player,
          // Walls
          GAME.createWall(512, 737, 1024, 60),
          GAME.createWall(31, 594, 60, 347),
          GAME.createWall(993, 594, 60, 347),
          GAME.createWall(512, 450, 1024, 60),
          // Enemies
          GAME.createEnemy(300, 682, 50, 50),
          GAME.createEnemy(600, 682, 50, 50),
          // Exit
          GAME.createExit(850, 657, 100, 100)
        ];
        break;
      // Level 5
      case 5 :
        GAME.player = GAME.createPlayer(150, 600);
        entities = [GAME.player,
          // Walls
          GAME.createWall(512, 737, 1024, 60),
          GAME.createWall(31, 412, 60, 710),
          GAME.createWall(993, 412, 60, 710),
          GAME.createWall(512, 87, 1024, 60),
          // Enemies
          GAME.createEnemy(500, 607, 100, 200),
          GAME.createEnemy(500, 217, 100, 200),
          // Exit
          GAME.createExit(850, 657, 100, 100)
        ];
        break;
        // Level 6
      case 6:
        GAME.player = GAME.createPlayer(150, 650);
        entities = [GAME.player,
          // Walls
          GAME.createWall(512, 737, 1024, 60),
          GAME.createWall(31, 622, 60, 290),
          GAME.createWall(993, 412, 60, 710),
          GAME.createWall(401, 507, 800, 60),
          GAME.createWall(771, 387, 60, 300),
          GAME.createWall(802, 87, 442, 60),
          GAME.createWall(691, 267, 220, 60),
          GAME.createWall(611, 177, 60, 240),
          // Sticky wall
          GAME.createStickyWall(300, 527, 60, 20),
          GAME.createStickyWall(650, 527, 60, 20),
          GAME.createStickyWall(973, 527, 20, 60),
          GAME.createStickyWall(791, 380, 20, 60),
          GAME.createStickyWall(973, 227, 20, 60),
          // Enemies
          GAME.createEnemy(300, 682, 60, 50),
          GAME.createEnemy(650, 682, 60, 50),
          // Exit
          GAME.createExit(651, 177, 20, 120)
        ];
        break;
      // Level 7
      case 7:
        GAME.player = GAME.createPlayer(200, 650);
        entities = [GAME.player,
          // Walls
          GAME.createWall(512, 737, 1024, 60),
          GAME.createWall(31, 412, 60, 710),
          GAME.createWall(993, 412, 60, 710),
          GAME.createWall(512, 87, 1024, 60),
          GAME.createWall(361, 482, 40, 450),
          GAME.createWall(662, 307, 40, 380),
          GAME.createWall(306, 267, 150, 20),
          GAME.createWall(511, 687, 60, 40),
          GAME.createWall(825, 692, 60, 30),
          GAME.createWall(825, 292, 40, 30),
          GAME.createWall(727, 467, 70, 20),
          GAME.createWall(918, 467, 70, 20),
          // Sticky wall
          GAME.createStickyWall(361, 480, 40, 80),
          GAME.createStickyWall(41, 250, 40, 80),
          GAME.createStickyWall(512, 107, 100, 20),
          GAME.createStickyWall(662, 507, 60, 20),
          GAME.createStickyWall(825, 302, 40, 10),
          GAME.createStickyWall(747, 112, 40, 10),
          GAME.createStickyWall(903, 112, 40, 10),
          // Enemies
          GAME.createEnemy(124, 500, 125, 40),
          GAME.createEnemy(71, 430, 20, 100),
          GAME.createEnemy(303, 287, 75, 20),
          GAME.createEnemy(391, 487, 20, 440),
          GAME.createEnemy(632, 307, 20, 380),
          GAME.createEnemy(441, 697, 80, 20),
          GAME.createEnemy(668, 697, 254, 20),
          GAME.createEnemy(909, 697, 107, 20),
          GAME.createEnemy(687, 307, 10, 380),
          GAME.createEnemy(958, 402, 10, 570),
          GAME.createEnemy(727, 487, 70, 20),
          GAME.createEnemy(918, 487, 70, 20),
          // Exit
          GAME.createExit(825, 197, 10, 160)
        ];
        break;
      // End
      case 8 :
        GAME.player = GAME.createPlayer(512, 640);
        entities = [GAME.player, 
          //  Y
          GAME.createWall(115, 170, 20, 80, -45),
          GAME.createWall(155, 170, 20, 80, 45),
          GAME.createWall(135, 220, 20, 80),
          //  O
          GAME.createWall(260, 150, 100, 20),
          GAME.createWall(220, 200, 20, 120),
          GAME.createWall(300, 200, 20, 120),
          GAME.createWall(260, 250, 100, 20),
          //  U
          GAME.createWall(345, 200, 20, 120),
          GAME.createWall(425, 200, 20, 120),
          GAME.createWall(385, 250, 100, 20),
          //  W
          GAME.createWall(585, 200, 120, 20, 80),
          GAME.createWall(615, 200, 120, 20, -80),
          GAME.createWall(645, 200, 120, 20, 80),
          GAME.createWall(675, 200, 120, 20, -80),
          //  I
          GAME.createWall(760, 150, 100, 20),
          GAME.createWall(760, 200, 20, 120),
          GAME.createWall(760, 250, 100, 20),
          //  N
          GAME.createWall(885, 200, 140, 20, 50),
          GAME.createWall(845, 200, 20, 120),
          GAME.createWall(925, 200, 20, 120),
          // Player container
          GAME.createWall(512, 700, 800, 40),
          GAME.createWall(512, 400, 800, 40),
          GAME.createWall(132, 550, 40, 260),
          GAME.createWall(892, 550, 40, 260),
          // Exit
          GAME.createExit(275, 600, 80, 80)
        ];
        break;
    }

    Composite.add(GAME.engine.world, entities);
    Detector.setBodies(GAME.detector, entities);
  }
}

GAME.initialize();
