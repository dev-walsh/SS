import * as THREE from 'three';

export interface PhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: number;
  friction: number;
  mass: number;
}

export class RoulettePhysics {
  private static readonly GRAVITY = -9.81;
  private static readonly AIR_RESISTANCE = 0.99;
  private static readonly WHEEL_FRICTION = 0.98;
  private static readonly BALL_FRICTION = 0.985;

  /**
   * Initialize wheel physics state
   */
  public static initializeWheel(): PhysicsState {
    return {
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: 0,
      friction: this.WHEEL_FRICTION,
      mass: 10
    };
  }

  /**
   * Initialize ball physics state
   */
  public static initializeBall(radius: number = 4.5): PhysicsState {
    return {
      position: new THREE.Vector3(0, 0.5, radius),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: 0,
      friction: this.BALL_FRICTION,
      mass: 0.1
    };
  }

  /**
   * Update wheel rotation with physics
   */
  public static updateWheel(
    state: PhysicsState, 
    deltaTime: number, 
    targetVelocity?: number
  ): PhysicsState {
    const newState = { ...state };

    // Apply target velocity if provided (for starting spin)
    if (targetVelocity !== undefined) {
      newState.angularVelocity = targetVelocity;
    }

    // Apply friction
    newState.angularVelocity *= Math.pow(newState.friction, deltaTime * 60);

    // Stop if velocity is very low
    if (Math.abs(newState.angularVelocity) < 0.001) {
      newState.angularVelocity = 0;
    }

    return newState;
  }

  /**
   * Update ball physics with collision detection
   */
  public static updateBall(
    ballState: PhysicsState,
    wheelState: PhysicsState,
    deltaTime: number,
    wheelRadius: number = 5
  ): PhysicsState {
    const newState = { ...ballState };

    // Calculate current distance from center
    const currentRadius = Math.sqrt(
      newState.position.x * newState.position.x + 
      newState.position.z * newState.position.z
    );

    // Apply centripetal force if ball is moving
    if (newState.angularVelocity !== 0) {
      const centripetal = newState.angularVelocity * newState.angularVelocity * currentRadius;
      
      // Gradually move ball inward due to gravity and friction
      const inwardVelocity = -deltaTime * 2; // Adjust for desired speed
      const newRadius = Math.max(1.5, currentRadius + inwardVelocity);
      
      // Update position
      const angle = Math.atan2(newState.position.z, newState.position.x);
      newState.position.x = Math.cos(angle) * newRadius;
      newState.position.z = Math.sin(angle) * newRadius;
    }

    // Apply angular velocity
    if (newState.angularVelocity !== 0) {
      const angle = Math.atan2(newState.position.z, newState.position.x);
      const newAngle = angle + newState.angularVelocity * deltaTime;
      
      const radius = Math.sqrt(
        newState.position.x * newState.position.x + 
        newState.position.z * newState.position.z
      );
      
      newState.position.x = Math.cos(newAngle) * radius;
      newState.position.z = Math.sin(newAngle) * radius;
    }

    // Apply friction
    newState.angularVelocity *= Math.pow(newState.friction, deltaTime * 60);

    // Stop ball when it reaches the center area
    if (currentRadius <= 2 && Math.abs(newState.angularVelocity) < 0.1) {
      newState.angularVelocity = 0;
      
      // Snap to nearest pocket position
      const snappedPosition = this.snapToPocket(newState.position, wheelState.angularVelocity);
      newState.position = snappedPosition;
    }

    return newState;
  }

  /**
   * Snap ball to nearest pocket position
   */
  private static snapToPocket(
    ballPosition: THREE.Vector3, 
    wheelRotation: number
  ): THREE.Vector3 {
    // Get angle from ball position
    const ballAngle = Math.atan2(ballPosition.z, ballPosition.x);
    
    // Number of pockets (37 for European roulette)
    const pocketCount = 37;
    const pocketAngle = (Math.PI * 2) / pocketCount;
    
    // Find nearest pocket considering wheel rotation
    const adjustedAngle = ballAngle - wheelRotation;
    const nearestPocketIndex = Math.round(adjustedAngle / pocketAngle);
    const nearestPocketAngle = nearestPocketIndex * pocketAngle + wheelRotation;
    
    // Position at pocket radius
    const pocketRadius = 1.8;
    return new THREE.Vector3(
      Math.cos(nearestPocketAngle) * pocketRadius,
      ballPosition.y,
      Math.sin(nearestPocketAngle) * pocketRadius
    );
  }

  /**
   * Calculate spin parameters for realistic wheel spin
   */
  public static calculateSpinParameters(): {
    wheelVelocity: number;
    ballVelocity: number;
    duration: number;
  } {
    // Random but realistic spin parameters
    const wheelVelocity = 0.2 + Math.random() * 0.3; // 0.2 to 0.5 rad/s
    const ballVelocity = -(0.8 + Math.random() * 0.4); // -0.8 to -1.2 rad/s (opposite direction)
    const duration = 8 + Math.random() * 4; // 8 to 12 seconds
    
    return { wheelVelocity, ballVelocity, duration };
  }

  /**
   * Check if physics simulation should stop
   */
  public static shouldStop(wheelState: PhysicsState, ballState: PhysicsState): boolean {
    const wheelStopped = Math.abs(wheelState.angularVelocity) < 0.01;
    const ballStopped = Math.abs(ballState.angularVelocity) < 0.01;
    
    return wheelStopped && ballStopped;
  }

  /**
   * Apply impulse to start the spin
   */
  public static applySpinImpulse(
    wheelState: PhysicsState,
    ballState: PhysicsState,
    wheelForce: number,
    ballForce: number
  ): { wheel: PhysicsState; ball: PhysicsState } {
    const newWheelState = { ...wheelState };
    const newBallState = { ...ballState };
    
    // Apply impulse to wheel
    newWheelState.angularVelocity = wheelForce;
    
    // Apply impulse to ball (opposite direction)
    newBallState.angularVelocity = ballForce;
    
    // Reset ball to outer edge
    const startRadius = 4.8;
    const startAngle = Math.random() * Math.PI * 2;
    newBallState.position.x = Math.cos(startAngle) * startRadius;
    newBallState.position.z = Math.sin(startAngle) * startRadius;
    newBallState.position.y = 0.5;
    
    return { wheel: newWheelState, ball: newBallState };
  }

  /**
   * Calculate collision response when ball hits wheel edge
   */
  public static handleCollision(
    ballState: PhysicsState,
    wheelRadius: number,
    restitution: number = 0.7
  ): PhysicsState {
    const newState = { ...ballState };
    
    const currentRadius = Math.sqrt(
      newState.position.x * newState.position.x + 
      newState.position.z * newState.position.z
    );
    
    // If ball hits outer wall
    if (currentRadius > wheelRadius) {
      // Reflect velocity
      newState.angularVelocity *= -restitution;
      
      // Move ball back inside
      const angle = Math.atan2(newState.position.z, newState.position.x);
      newState.position.x = Math.cos(angle) * wheelRadius;
      newState.position.z = Math.sin(angle) * wheelRadius;
    }
    
    return newState;
  }
}
