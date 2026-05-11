const canvas: HTMLCanvasElement = document.querySelector("canvas")!;
canvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
canvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);

const TABLE_LENGTH: number = Math.min(canvas.width, canvas.height);
const PADDING: number = TABLE_LENGTH / 50;
const NUMBER_OF_CIRCLES = 5;
const CIRCLE_RADIUS: number =
    ((TABLE_LENGTH - (PADDING * (NUMBER_OF_CIRCLES + 2))) /
        (NUMBER_OF_CIRCLES + 1)) / 2;
const START_ANGLE: number = -(Math.PI / 2);
const BASE_ANGLE_INCREMENT: number = Math.PI / 180;
const NUMBER_OF_SEGMENTS = 180;
const ANGLE_INCREMENT_FACTOR: number = 360 / NUMBER_OF_SEGMENTS;

const context: CanvasRenderingContext2D = canvas.getContext("2d")!;

class Circle {
    public readonly centerX: number;
    public readonly centerY: number;
    public readonly radius: number;
    public readonly angleIncrement: number;
    public readonly hue: number;
    public currentAngle: number = START_ANGLE;

    public constructor(
        centerX: number,
        centerY: number,
        radius: number,
        angleIncrement: number,
        hue: number,
    ) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.radius = radius;
        this.angleIncrement = angleIncrement;
        this.hue = hue;
    }

    public get pointX(): number {
        return this.centerX + this.radius * Math.cos(this.currentAngle);
    }

    public get pointY(): number {
        return this.centerY + this.radius * Math.sin(this.currentAngle);
    }

    public render(): void {
        context.strokeStyle = `hsl(${this.hue}, 100%, 75%)`;
        context.lineWidth = this.radius / 10;
        context.beginPath();
        context.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = "white";
        context.beginPath();
        context.arc(this.pointX, this.pointY, this.radius / 10, 0, Math.PI * 2);
        context.fill();
    }

    public update(): void {
        this.currentAngle += this.angleIncrement;
    }
}

class LissajousCurveTable {
    private readonly horizontalAxisCircles: Circle[] = [];
    private readonly verticalAxisCircles: Circle[] = [];
    private readonly circleHues: number[] = [];

    public constructor() {
        for (let i = 0; i < NUMBER_OF_CIRCLES; i += 1) {
            this.circleHues.push((360 / NUMBER_OF_CIRCLES) * i);
            this.horizontalAxisCircles.push(
                new Circle(
                    ((i + 1) * (PADDING + (CIRCLE_RADIUS * 2))) +
                        CIRCLE_RADIUS + PADDING,
                    PADDING + CIRCLE_RADIUS,
                    CIRCLE_RADIUS,
                    BASE_ANGLE_INCREMENT * (i + 1),
                    this.circleHues[i]!,
                ),
            );
            this.verticalAxisCircles.push(
                new Circle(
                    PADDING + CIRCLE_RADIUS,
                    ((i + 1) * (PADDING + (CIRCLE_RADIUS * 2))) +
                        CIRCLE_RADIUS + PADDING,
                    CIRCLE_RADIUS,
                    BASE_ANGLE_INCREMENT * (i + 1),
                    this.circleHues[i]!,
                ),
            );
        }
    }

    public render(): void {
        for (let i = 0; i < NUMBER_OF_CIRCLES; i += 1) {
            this.horizontalAxisCircles[i]!.render();
            this.verticalAxisCircles[i]!.render();
        }
        for (let i = 0; i < NUMBER_OF_CIRCLES; i += 1) {
            context.lineWidth = CIRCLE_RADIUS / 15;
            for (let j = 0; j < NUMBER_OF_CIRCLES; j += 1) {
                const averageHue: number = (this.horizontalAxisCircles[j]!.hue +
                    this.verticalAxisCircles[i]!.hue) / 2;
                context.strokeStyle = `hsl(${averageHue}, 100%, 75%)`;
                const horizontalAxisCircle: Circle = this
                    .horizontalAxisCircles[j]!;
                const verticalAxisCircle: Circle = this.verticalAxisCircles[i]!;
                let angleX: number = horizontalAxisCircle.currentAngle;
                let angleY: number = verticalAxisCircle.currentAngle;
                let lastX: number = horizontalAxisCircle.centerX +
                    horizontalAxisCircle.radius * Math.cos(angleX);
                let lastY: number = verticalAxisCircle.centerY +
                    verticalAxisCircle.radius * Math.sin(angleY);
                for (let k: number = NUMBER_OF_SEGMENTS + 1; k > 0; k -= 1) {
                    context.globalAlpha = 1 - (k / NUMBER_OF_SEGMENTS);
                    const nextX: number = horizontalAxisCircle.centerX +
                        horizontalAxisCircle.radius * Math.cos(angleX);
                    const nextY: number = verticalAxisCircle.centerY +
                        verticalAxisCircle.radius * Math.sin(angleY);
                    context.beginPath();
                    context.moveTo(lastX, lastY);
                    context.lineTo(nextX, nextY);
                    context.stroke();
                    lastX = nextX;
                    lastY = nextY;
                    angleX += horizontalAxisCircle.angleIncrement *
                        ANGLE_INCREMENT_FACTOR;
                    angleY += verticalAxisCircle.angleIncrement *
                        ANGLE_INCREMENT_FACTOR;
                }
                context.globalAlpha = 1;
                context.beginPath();
                context.arc(
                    this.horizontalAxisCircles[j]!.pointX,
                    this.verticalAxisCircles[i]!.pointY,
                    CIRCLE_RADIUS / 15,
                    0,
                    Math.PI * 2,
                );
                context.fill();
            }
            context.strokeStyle = "white";
            context.globalAlpha = 0.75;
            context.lineWidth = 1;
            context.setLineDash([CIRCLE_RADIUS / 10, CIRCLE_RADIUS / 10]);
            context.beginPath();
            context.moveTo(
                this.horizontalAxisCircles[i]!.pointX,
                this.horizontalAxisCircles[i]!.pointY,
            );
            context.lineTo(this.horizontalAxisCircles[i]!.pointX, TABLE_LENGTH);
            context.stroke();
            context.beginPath();
            context.moveTo(
                this.verticalAxisCircles[i]!.pointX,
                this.verticalAxisCircles[i]!.pointY,
            );
            context.lineTo(TABLE_LENGTH, this.verticalAxisCircles[i]!.pointY);
            context.stroke();
            context.setLineDash([]);
            context.globalAlpha = 1;
        }
    }

    public update(): void {
        for (let i = 0; i < NUMBER_OF_CIRCLES; i += 1) {
            this.horizontalAxisCircles[i]!.update();
            this.verticalAxisCircles[i]!.update();
        }
    }
}

const table: LissajousCurveTable = new LissajousCurveTable();

function animate(): void {
    context.fillStyle = "hsl(0, 0%, 20%)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    table.render();
    table.update();
    requestAnimationFrame(animate);
}

animate();
