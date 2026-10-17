'use client';

import { Package, Cookie, Croissant, Beef, Apple, Lollipop } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const iconComponents = [
  { Icon: Package, size: 48 },
  { Icon: Cookie, size: 40 },
  { Icon: Croissant, size: 56 },
  { Icon: Beef, size: 48 },
  { Icon: Apple, size: 40 },
  { Icon: Lollipop, size: 32 },
];

interface IconData {
  id: number;
  Icon: React.ElementType;
  size: number;
  x: number;
  duration: number;
  delay: number;
  rotation: number;
}

const FloatingIcons = () => {
  const [iconData, setIconData] = useState<IconData[]>([]);

  useEffect(() => {
    const generatedIcons = Array.from({ length: 15 }).map((_, i) => {
      const component = iconComponents[i % iconComponents.length];
      return {
        id: i,
        Icon: component.Icon,
        size: component.size,
        x: Math.random() * 100, // random start x position (vw)
        duration: Math.random() * 20 + 20, // 20s to 40s duration
        delay: Math.random() * 10,
        rotation: Math.random() * 360,
      };
    });
    setIconData(generatedIcons);
  }, []);

  return (
    // ponytail: hide heavy continuous SVG floating animations on mobile to conserve CPU/battery
    <div className="hidden md:block fixed top-0 left-0 w-full h-full -z-20 overflow-hidden pointer-events-none">
      {iconData.map(({ id, Icon, size, x, duration, delay, rotation }) => (
        <motion.div
          key={id}
          className="absolute text-primary/10" // Using primary green color with low opacity
          initial={{ y: '-10vh', x: `${x}vw`, rotate: 0, opacity: 0 }}
          animate={{
            y: '110vh',
            rotate: rotation,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: 'linear',
          }}
          style={{ width: size, height: size }}
        >
          <Icon size={size} />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingIcons;
