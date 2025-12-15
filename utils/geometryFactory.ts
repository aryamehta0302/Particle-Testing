import { ShapeType, TRAIL_LENGTH } from '../types';

export const generateGeometry = (type: ShapeType, count: number): Float32Array => {
  const totalVertices = count * TRAIL_LENGTH;
  const positions = new Float32Array(totalVertices * 3);

  const setPoint = (index: number, x: number, y: number, z: number) => {
    // We replicate the same position for all trail segments of a single particle
    // The shader handles the offset
    for (let t = 0; t < TRAIL_LENGTH; t++) {
      const i = (index * TRAIL_LENGTH + t) * 3;
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;
    }
  };

  const randomPointInSphere = (radius: number) => {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    // Avoid center - use minimum radius to keep particles on outer surface
    const r = radius * (0.8 + Math.cbrt(Math.random()) * 0.2); // Min 0.8 * radius
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
    };
  };

  const distanceFromCenter = (x: number, y: number, z: number) => {
    return Math.sqrt(x * x + y * y + z * z);
  };

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      attempts++;
      switch (type) {
        case ShapeType.SPHERE: {
          const p = randomPointInSphere(2.5);
          x = p.x; y = p.y; z = p.z;
          break;
        }
        case ShapeType.HEART: {
          const t = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random());
          const scale = 0.15;
          x = scale * 16 * Math.pow(Math.sin(t), 3);
          y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          z = (Math.random() - 0.5) * 2.0 * r; 
          y += 0.5;
          break;
        }
        case ShapeType.FLOWER: {
          const scale = 0.1;
          const goldenAngle = Math.PI * (3 - Math.sqrt(5));
          const theta = i * goldenAngle;
          const r = scale * Math.sqrt(i);
          x = r * Math.cos(theta);
          y = (Math.random() - 0.5) * 0.5;
          z = r * Math.sin(theta);
          y += Math.cos(r * 1.5) * 1.0 - 0.5;
          break;
        }
        case ShapeType.SATURN: {
          if (Math.random() > 0.4) {
            const p = randomPointInSphere(1.2);
            x = p.x; y = p.y; z = p.z;
          } else {
            const angle = Math.random() * Math.PI * 2;
            const dist = 1.8 + Math.random() * 1.5;
            x = Math.cos(angle) * dist;
            z = Math.sin(angle) * dist;
            y = (Math.random() - 0.5) * 0.1;
            
            const tilt = 0.4;
            const tempY = y;
            y = y * Math.cos(tilt) - z * Math.sin(tilt);
            z = tempY * Math.sin(tilt) + z * Math.cos(tilt);
          }
          break;
        }
        case ShapeType.BUDDHA: {
          const r = Math.random();
          if (r < 0.25) {
            const p = randomPointInSphere(0.6);
            x = p.x; y = p.y + 1.2; z = p.z;
          } else if (r < 0.65) {
            const p = randomPointInSphere(1.0);
            x = p.x * 1.1; y = p.y * 1.2; z = p.z * 0.9;
          } else {
            const angle = Math.random() * Math.PI * 2;
            const dist = 1.0 + Math.random() * 0.8;
            x = Math.cos(angle) * dist;
            z = Math.sin(angle) * dist;
            y = -1.2 + (Math.random() - 0.5) * 0.5;
          }
          break;
        }
        case ShapeType.FIREWORKS: {
          const p = randomPointInSphere(0.2);
          x = p.x * 10.0;
          y = p.y * 10.0;
          z = p.z * 10.0;
          break;
        }
      }
    } while (distanceFromCenter(x, y, z) < 0.3 && attempts < maxAttempts);
    
    setPoint(i, x, y, z);
  }

  return positions;
};

export const generateAttributes = (count: number) => {
  const total = count * TRAIL_LENGTH;
  const trailIndices = new Float32Array(total);
  const scales = new Float32Array(total);

  for (let i = 0; i < count; i++) {
    const scale = 0.5 + Math.random();
    for (let t = 0; t < TRAIL_LENGTH; t++) {
      const idx = i * TRAIL_LENGTH + t;
      trailIndices[idx] = t; // 0 to 4
      scales[idx] = scale;
    }
  }

  return { trailIndices, scales };
};