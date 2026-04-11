import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Page transition wrapper
export function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for lists
export function StaggerContainer({ children, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Premium loading spinner
export function PremiumLoader({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} border-4 border-gold/20 border-t-gold rounded-full`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-t-white/10 rounded-full`}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  );
}

// Skeleton loading card
export function SkeletonCard() {
  return (
    <div className="bg-dark-card rounded-xl overflow-hidden">
      <div className="h-48 bg-dark-border animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-dark-border rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-dark-border rounded w-1/2 animate-pulse" />
        <div className="flex justify-between pt-2">
          <div className="h-4 bg-dark-border rounded w-20 animate-pulse" />
          <div className="h-4 bg-dark-border rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Animated button with hover effects
export function AnimatedButton({ children, onClick, variant = 'primary', className = '', disabled = false }) {
  const variants = {
    primary: 'bg-gold text-dark hover:bg-gold-light',
    secondary: 'bg-dark-card text-white border border-dark-border hover:border-gold',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
}

// Fade in section on scroll
export function FadeInSection({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated counter
export function AnimatedCounter({ value, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Hover card with lift effect
export function HoverCard({ children, className = '' }) {
  return (
    <motion.div
      className={`bg-dark-card rounded-xl overflow-hidden border border-dark-border ${className}`}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Text reveal animation
export function TextReveal({ text, className = '' }) {
  return (
    <motion.h2
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {text}
    </motion.h2>
  );
}

// Pulse notification dot
export function PulseDot({ color = 'gold' }) {
  const colors = {
    gold: 'bg-gold',
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  };

  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`}></span>
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[color]}`}></span>
    </span>
  );
}

// Page loader overlay
export function PageLoaderOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-dark/90 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="text-center">
        <PremiumLoader size="xl" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-gold font-semibold"
        >
          Loading...
        </motion.p>
      </div>
    </motion.div>
  );
}

// Image with hover zoom
export function AnimatedImage({ src, alt, className = '' }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </div>
  );
}
