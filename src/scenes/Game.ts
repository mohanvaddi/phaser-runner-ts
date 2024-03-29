import Phaser from 'phaser';
import SceneKeys from '../consts/SceneKeys';
import TextureKeys from '../consts/Texturekeys';
import RocketMouse from '../game/RocketMouse';
import LaserObstacle from '../game/LaserObstacle';

export default class Game extends Phaser.Scene {
    private background!: Phaser.GameObjects.TileSprite;
    private mouseHole!: Phaser.GameObjects.Image;
    private window1!: Phaser.GameObjects.Image;
    private window2!: Phaser.GameObjects.Image;
    private bookcase1!: Phaser.GameObjects.Image;
    private bookcase2!: Phaser.GameObjects.Image;
    private windows: Phaser.GameObjects.Image[] = [];
    private bookcases: Phaser.GameObjects.Image[] = [];
    private laserObstacle!: LaserObstacle;
    private coins!: Phaser.Physics.Arcade.StaticGroup;
    private scoreLablel!: Phaser.GameObjects.Text;
    private score: number = 0;
    // private mouse!: RocketMouse;

    init() {
        this.score = 0;
    }

    constructor() {
        super(SceneKeys.Game);
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // * create background
        // instead of image, tileSprite can be added to conveniently repeat the same image over a given width.
        this.background = this.add
            .tileSprite(0, 0, width, height, TextureKeys.Background)
            .setOrigin(0, 0)
            .setScrollFactor(0, 0);

        // * create mouse hole
        this.mouseHole = this.add.image(
            Phaser.Math.Between(900, 1500),
            501,
            TextureKeys.MouseHole
        );

        // * create windows
        this.window1 = this.add.image(
            Phaser.Math.Between(900, 1300),
            200,
            TextureKeys.Window1
        );
        this.window2 = this.add.image(
            Phaser.Math.Between(1600, 2000),
            200,
            TextureKeys.Window2
        );

        this.windows = [this.window1, this.window2];

        // * create bookcases
        this.bookcase1 = this.add
            .image(Phaser.Math.Between(2200, 2700), 580, TextureKeys.Bookcase1)
            .setOrigin(0.5, 1);
        this.bookcase2 = this.add
            .image(Phaser.Math.Between(2900, 3400), 580, TextureKeys.Bookcase2)
            .setOrigin(0.5, 1);

        this.bookcases = [this.bookcase1, this.bookcase2];

        this.laserObstacle = new LaserObstacle(this, 900, 100);
        this.add.existing(this.laserObstacle);

        this.coins = this.physics.add.staticGroup();
        this.spwanCoins();

        const mouse = new RocketMouse(this, width * 0.5, height - 30);
        this.add.existing(mouse);

        const body = mouse.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);

        // ! to make mouse run
        body.setVelocityX(200);

        // ! world bounds
        this.physics.world.setBounds(
            0,
            0,
            Number.MAX_SAFE_INTEGER,
            height - 55
        );

        // ! Set Camera to follow the mouse
        // * tells the camera to follow Rocket Mouse as he moves around the world
        this.cameras.main.startFollow(mouse);
        // *  sets the bounds for the camera so that it doesn’t move past the top or bottom of the screen.
        this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height);

        // * mouse in contact with laser
        this.physics.add.overlap(
            this.laserObstacle,
            mouse,
            this.handleOverlapLaser,
            undefined,
            this
        );

        // * mouse in contact with coin
        this.physics.add.overlap(
            this.coins,
            mouse,
            this.handleCollectCoin,
            undefined,
            this
        );

        // * scoreLabel to display score
        this.scoreLablel = this.add
            .text(10, 10, `Score: ${this.score}`, {
                fontSize: '24px',
                color: '#080808',
                backgroundColor: '#f8e71c',
                shadow: {
                    fill: true,
                    blur: 0,
                    offsetY: 0,
                },
                padding: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10,
                },
            })
            .setScrollFactor(0);
    }

    update(): void {
        // * wrap holes, windows, bookcases
        this.wrapMouseHole();
        this.wrapWindows();
        this.wrapBookCases();
        this.wrapLaserObstacle();
        // this.teleportBackwards();

        //! scroll the background
        this.background.setTilePosition(this.cameras.main.scrollX);
    }

    private wrapMouseHole() {
        const scrollX = this.cameras.main.scrollX;
        const rightEdge = scrollX + this.scale.width;
        if (this.mouseHole.x + this.mouseHole.width < scrollX) {
            this.mouseHole.x = Phaser.Math.Between(
                rightEdge + 100,
                rightEdge + 1000
            );
        }
    }

    private wrapWindows() {
        const scrollX = this.cameras.main.scrollX;
        const rightEdge = scrollX + this.scale.width;

        let width = this.window1.width * 2;
        if (this.window1.x + width < scrollX) {
            this.window1.x = Phaser.Math.Between(
                rightEdge + width,
                rightEdge + width + 800
            );

            const overlap = this.bookcases.find((bc) => {
                return Math.abs(this.window1.x - bc.x) <= this.window1.width;
            });

            this.window1.visible = !overlap;
        }

        width = this.window2.width;
        if (this.window2.x + width < scrollX) {
            this.window2.x = Phaser.Math.Between(
                this.window1.x + width,
                this.window1.x + width + 800
            );

            const overlap = this.bookcases.find((bc) => {
                return Math.abs(this.window2.x - bc.x) <= this.window2.width;
            });

            this.window2.visible = !overlap;
        }
    }

    private wrapBookCases() {
        const scrollX = this.cameras.main.scrollX;
        const rightEdge = scrollX + this.scale.width;

        let width = this.bookcase1.width * 2;
        if (this.bookcase1.x + width < scrollX) {
            this.bookcase1.x = Phaser.Math.Between(
                rightEdge + width,
                rightEdge + width + 800
            );

            const overlap = this.windows.find((win) => {
                return Math.abs(this.bookcase1.x - win.x) <= win.width;
            });
            this.bookcase1.visible = !overlap;
        }

        width = this.bookcase2.width;
        if (this.bookcase2.x + width < scrollX) {
            this.bookcase2.x = Phaser.Math.Between(
                this.bookcase1.x + width,
                this.bookcase1.x + width + 800
            );
            const overlap = this.windows.find((win) => {
                return Math.abs(this.bookcase2.x - win.x) <= win.width;
            });
            this.bookcase2.visible = !overlap;

            this.spwanCoins();
        }
    }

    private wrapLaserObstacle() {
        const scrollX = this.cameras.main.scrollX;
        const rightEdge = scrollX + this.scale.width;

        const body = this.laserObstacle.body as Phaser.Physics.Arcade.Body;

        const width = body.width;
        if (this.laserObstacle.x + width < scrollX) {
            this.laserObstacle.x = Phaser.Math.Between(
                rightEdge + width,
                rightEdge + width + 1000
            );

            this.laserObstacle.y = Phaser.Math.Between(0, 300);

            body.position.x = this.laserObstacle.x + body.offset.x;
            body.position.y = this.laserObstacle.y;
        }
    }

    private handleOverlapLaser(
        _obj1: Phaser.GameObjects.GameObject,
        obj2: Phaser.GameObjects.GameObject
    ) {
        console.log('overlap!');
        const mouse = obj2 as RocketMouse;
        mouse.kill();
    }

    private spwanCoins() {
        this.coins.children.each((child) => {
            const coin = child as Phaser.Physics.Arcade.Sprite;
            this.coins.killAndHide(coin);
            coin.body.enable = false;
        });

        const scrollX = this.cameras.main.scrollX;
        const rightEdge = scrollX + this.scale.width;

        let x = rightEdge + 100;
        const numCoins = Phaser.Math.Between(1, 20);
        for (let i = 0; i < numCoins; i++) {
            const coin = this.coins.get(
                x,
                Phaser.Math.Between(100, this.scale.height - 100),
                TextureKeys.Coin
            ) as Phaser.Physics.Arcade.Sprite;

            coin.setVisible(true);
            coin.setActive(true);

            const body = coin.body as Phaser.Physics.Arcade.Body;
            body.setCircle(body.width * 0.5);
            body.enable = true;
            body.updateFromGameObject();
            x += coin.width * 1.5;
        }
    }

    private handleCollectCoin(
        _obj1: Phaser.GameObjects.GameObject,
        obj2: Phaser.GameObjects.GameObject
    ) {
        const coin = obj2 as Phaser.Physics.Arcade.Sprite;

        this.coins.killAndHide(coin);

        coin.body.enable = false;

        this.score += 1;
        this.scoreLablel.text = `Score: ${this.score}`;
    }

    // private teleportBackwards() {
    //     const scrollX = this.cameras.main.scrollX;
    //     const maxX = 2500;
    //     if (scrollX > maxX) {
    //         this.mouse.x -= maxX;
    //         this.mouseHole.x -= maxX;

    //         this.windows.forEach((win) => {
    //             win.x -= maxX;
    //         });

    //         this.bookcases.forEach((bc) => {
    //             bc.x -= maxX;
    //         });

    //         this.laserObstacle.x -= maxX;
    //         const laserBody = this.laserObstacle
    //             .body as Phaser.Physics.Arcade.StaticBody;

    //         laserBody.x -= maxX;
    //         this.coins.children.each((child) => {
    //             const coin = child as Phaser.Physics.Arcade.Sprite;
    //             if (!coin.active) {
    //                 return;
    //             }
    //             coin.x -= maxX;
    //             const body = coin.body as Phaser.Physics.Arcade.StaticBody;
    //             body.updateFromGameObject();
    //         });
    //     }
    // }
}
