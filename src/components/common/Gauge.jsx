// src/components/common/Gauge.jsx
import React, { useState, useEffect } from 'react';
import './Gauge.css';

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  // SVG coordinate system starts 90 degrees offset from standard Cartesian system
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const getArcPath = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(' ');
};

const Gauge = ({
  activeGradient = ['#a855f7', '#06b6d4'],
  centerValue = 0,
  defaultLabel = 'Balance',
  endAngle = 400,
  formatOptions = { style: 'currency', currency: 'BYN', maximumFractionDigits: 0 },
  inactiveFillOpacity = 0.4,
  inactiveGradient = ['#334155', '#38bdf8'],
  notchCornerRadius = 7,
  spacing = 0,
  startAngle = 140,
  useGradient = true,
  value = 0,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Smooth easeOutCubic animation using requestAnimationFrame
  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200; // 1.2s transition

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      setAnimatedValue(ease * value);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
  }, [value]);

  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  const strokeWidth = 16;
  const totalArc = endAngle - startAngle;

  // Format currency/number for the center label
  // Fallback in case settings currency symbol cannot be parsed directly by Intl
  let formattedValue = '';
  try {
    formattedValue = new Intl.NumberFormat(undefined, formatOptions).format(centerValue);
  } catch (e) {
    // Basic fallback formatting if currency options fail
    formattedValue = `${centerValue.toLocaleString()} ${formatOptions.currency || ''}`;
  }

  // Active stroke style definition
  const activeStroke = useGradient ? 'url(#active-grad)' : (activeGradient ? activeGradient[0] : '#a855f7');
  const inactiveStroke = useGradient ? 'url(#inactive-grad)' : (inactiveGradient ? inactiveGradient[0] : '#334155');

  // Render method A: Solid Curved Arc (when spacing = 0)
  const renderSolidArc = () => {
    const backgroundPath = getArcPath(centerX, centerY, radius, startAngle, endAngle);
    
    // Calculate progress angle boundary
    const progressAngle = startAngle + totalArc * (animatedValue / 100);
    const progressPath = animatedValue > 0 
      ? getArcPath(centerX, centerY, radius, startAngle, progressAngle) 
      : '';

    return (
      <>
        {/* Background track */}
        <path
          d={backgroundPath}
          fill="none"
          stroke={inactiveStroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={inactiveFillOpacity}
        />
        {/* Progress active track */}
        {animatedValue > 0 && (
          <path
            d={progressPath}
            fill="none"
            stroke={activeStroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="gauge-progress-path"
          />
        )}
      </>
    );
  };

  // Render method B: Notched segments (when spacing > 0)
  const renderNotchedArc = () => {
    const totalNotches = 45; // default number of notches
    const step = totalArc / (totalNotches - 1);
    const notches = [];
    const notchLength = 14;

    for (let i = 0; i < totalNotches; i++) {
      const angle = startAngle + i * step;
      const innerRadius = radius - notchLength / 2;
      const outerRadius = radius + notchLength / 2;

      const inner = polarToCartesian(centerX, centerY, innerRadius, angle);
      const outer = polarToCartesian(centerX, centerY, outerRadius, angle);

      const notchProgressPercent = (i / (totalNotches - 1)) * 100;
      const isActive = notchProgressPercent <= animatedValue;

      notches.push(
        <line
          key={i}
          x1={inner.x}
          y1={inner.y}
          x2={outer.x}
          y2={outer.y}
          stroke={isActive ? activeStroke : inactiveStroke}
          strokeWidth={4}
          strokeLinecap={notchCornerRadius > 0 ? 'round' : 'butt'}
          opacity={isActive ? 1 : inactiveFillOpacity}
          className="gauge-notch-line"
        />
      );
    }

    return <>{notches}</>;
  };

  return (
    <div className="gauge-chart-wrapper">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 300"
        className="gauge-svg-element"
      >
        <defs>
          {useGradient && activeGradient && (
            <linearGradient id="active-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={activeGradient[0]} />
              <stop offset="100%" stopColor={activeGradient[1]} />
            </linearGradient>
          )}
          {useGradient && inactiveGradient && (
            <linearGradient id="inactive-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={inactiveGradient[0]} />
              <stop offset="100%" stopColor={inactiveGradient[1]} />
            </linearGradient>
          )}
        </defs>

        {/* Dynamic arc render */}
        {spacing === 0 ? renderSolidArc() : renderNotchedArc()}

        {/* Centered balance label and values overlay */}
        <foreignObject x="45" y="80" width="210" height="140">
          <div className="gauge-center-wrapper">
            <span className="gauge-center-label">{defaultLabel}</span>
            <h2 className="gauge-center-value">{formattedValue}</h2>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

export default Gauge;
