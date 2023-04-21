import { EventDispatcher, Quaternion, Vector3} from 'three';

const _changeEvent = { type: 'change' };

const EPSILON = 0.000001;

class FlyControls extends EventDispatcher {
    constructor(object, domElement) {
        super();

        this.object = object;
        this.domElement = domElement;

        this.movementSpeed = 1.0;
        this.rollSpeed = 0.005;

        this.dragToLook = false;
        this.autoForward = false;


        this.lastQuaternion = new Quaternion();
        this.lastPosition = new Vector3();

        this.tmpQuaternion = new Quaternion();

        this.status = 0;

        this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
        this.moveVector = new Vector3(0, 0, 0);
        this.rotationVector = new Vector3(0, 0, 0);

        const keydown = (event) => {
            if (event.altKey) {
                return;
            }

            switch (event.code) {
                case 'KeyW': this.moveState.forward = 1; break;
                case 'KeyS': this.moveState.back = 1; break;

                case 'KeyA': this.moveState.left = 1; break;
                case 'KeyD': this.moveState.right = 1; break;

                case 'KeyR': this.moveState.up = 1; break;
                case 'KeyF': this.moveState.down = 1; break;

                case 'KeyQ': this.moveState.rollLeft = 1; break;
                case 'KeyE': this.moveState.rollRight = 1; break;
            }

            this.updateMovementVector();
            this.updateRotationVector();
        };

        const keyup = (event) => {
            switch (event.code) {
                case 'KeyW': this.moveState.forward = 0; break;
                case 'KeyS': this.moveState.back = 0; break;

                case 'KeyA': this.moveState.left = 0; break;
                case 'KeyD': this.moveState.right = 0; break;

                case 'KeyR': this.moveState.up = 0; break;
                case 'KeyF': this.moveState.down = 0; break;

                case 'KeyQ': this.moveState.rollLeft = 0; break;
                case 'KeyE': this.moveState.rollRight = 0; break;
            }

            this.updateMovementVector();
            this.updateRotationVector();
        };

        this.dispose = () => {
            this.domElement.removeEventListener('contextmenu', contextmenu);
            window.removeEventListener('keydown', _keydown);
            window.removeEventListener('keyup', _keyup);
        };

        this.domElement.addEventListener('contextmenu', contextmenu);
        window.addEventListener('keydown', keydown);
        window.addEventListener('keyup', keyup);

        this.updateMovementVector();
        this.updateRotationVector();
    }

    updateRotationVector() {
        this.rotationVector.x = (- this.moveState.pitchDown + this.moveState.pitchUp);
        this.rotationVector.y = (- this.moveState.yawRight + this.moveState.yawLeft);
        this.rotationVector.z = (- this.moveState.rollRight + this.moveState.rollLeft);
    }

    updateMovementVector() {
        const forward = (this.moveState.forward || (this.autoForward && !this.moveState.back)) ? 1 : 0;

        this.moveVector.x = (- this.moveState.left + this.moveState.right);
        this.moveVector.y = (- this.moveState.down + this.moveState.up);
        this.moveVector.z = (- forward + this.moveState.back);
    };
    
    update(delta) {
        const moveMult = delta * this.movementSpeed;
        const rotMult = delta * this.rollSpeed;

        this.object.translateX(this.moveVector.x * moveMult);
        this.object.translateY(this.moveVector.y * moveMult);
        this.object.translateZ(this.moveVector.z * moveMult);

        this.tmpQuaternion.set(this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1).normalize();
        this.object.quaternion.multiply(this.tmpQuaternion);

        if (
            this.lastPosition.distanceToSquared(this.object.position) > EPSILON ||
            8 * (1 - this.lastQuaternion.dot(this.object.quaternion)) > EPSILON
        ) {

            this.dispatchEvent(_changeEvent);
            this.lastQuaternion.copy(this.object.quaternion);
            this.lastPosition.copy(this.object.position);

        }
    };
}

function contextmenu(event) {
    event.preventDefault();
}

export { FlyControls };