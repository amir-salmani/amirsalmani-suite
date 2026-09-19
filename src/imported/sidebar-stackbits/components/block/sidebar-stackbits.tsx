'use client';

import { Cloud, Folder, Home, Menu, PanelLeftClose, PanelsTopLeft, Star } from 'lucide-react';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

const HomeChildren = () => {
  return (
    <div className="w-full h-full bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] p-6">
      <div className="mb-8">
        <div className="h-8 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-24 animate-pulse"></div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="w-full bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] px-4 py-3 rounded-lg flex items-center gap-3">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))] rounded w-4 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))] rounded w-36 animate-pulse"></div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-12 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))] rounded w-4 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="w-full bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] px-4 py-3 rounded-lg flex items-center gap-3">
            <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-16 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="w-full hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] py-3 rounded-lg flex items-center gap-3">
            <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-40 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectsChildren = () => {
  return (
    <div className="w-full h-full bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] p-6">
      <div className="mb-8">
        <div className="h-6 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-32 animate-pulse mb-2"></div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-48 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] rounded-lg p-4 border-[color-mix(in_srgb,var(--fg)_37%,var(--bg))]">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-20 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-16 animate-pulse"></div>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] rounded-lg p-4 border-[color-mix(in_srgb,var(--fg)_37%,var(--bg))]">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-24 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-20 animate-pulse"></div>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] rounded-lg p-4 border-[color-mix(in_srgb,var(--fg)_37%,var(--bg))]">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-18 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-14 animate-pulse"></div>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] rounded-lg p-4 border-[color-mix(in_srgb,var(--fg)_37%,var(--bg))]">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-22 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-18 animate-pulse"></div>
        </div>
      </div>

      <div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-24 animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded">
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded-full w-3 animate-pulse"></div>
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded">
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded-full w-3 animate-pulse"></div>
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-28 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded">
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded-full w-3 animate-pulse"></div>
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-36 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplatesChildren = () => {
  return (
    <div className="w-full h-full bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] p-6">
      <div className="mb-8">
        <div className="h-6 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-28 animate-pulse mb-2"></div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-40 animate-pulse"></div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded-lg">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded-full w-4 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-24 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded-lg">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded-full w-4 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-20 animate-pulse"></div>
        </div>
      </div>

      <div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-32 animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="h-16 bg-gradient-to-r from-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/20 to-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/20 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-gradient-to-r from-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/20 to-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/20 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-gradient-to-r from-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/20 to-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/20 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const AIChildren = () => {
  return (
    <div className="w-full h-full bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] p-6">
      <div className="mb-8">
        <div className="h-6 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-20 animate-pulse mb-2"></div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-36 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 to-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 rounded-lg p-4">
          <div className="h-5 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-5 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-16 animate-pulse"></div>
        </div>
        <div className="bg-gradient-to-br from-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 to-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 rounded-lg p-4">
          <div className="h-5 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-5 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-20 animate-pulse"></div>
        </div>
        <div className="bg-gradient-to-br from-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 to-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 rounded-lg p-4 ">
          <div className="h-5 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-5 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-18 animate-pulse"></div>
        </div>
        <div className="bg-gradient-to-br from-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 to-[color-mix(in_srgb,var(--fg)_45%,var(--bg))]/20 rounded-lg p-4">
          <div className="h-5 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-5 animate-pulse mb-2"></div>
          <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-22 animate-pulse"></div>
        </div>
      </div>

      <div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-28 animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] rounded">
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-40 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] rounded">
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-36 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CloudChildren = () => {
  return (
    <div className="w-full h-full bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] p-6">
      <div className="mb-8">
        <div className="h-6 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-24 animate-pulse mb-2"></div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-32 animate-pulse"></div>
      </div>

      <div className="bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-16 animate-pulse"></div>
        </div>
        <div className="w-full bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded-full h-2 mb-2">
          <div className="bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))] h-2 rounded-full w-3/4 animate-pulse"></div>
        </div>
        <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-24 animate-pulse"></div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded-lg hover:bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] transition-colors">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-4 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-20 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded-lg hover:bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] transition-colors">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-4 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-24 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded-lg hover:bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] transition-colors">
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-4 animate-pulse"></div>
          <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-28 animate-pulse"></div>
        </div>
      </div>

      <div>
        <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] rounded w-24 animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded">
            <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-4 animate-pulse"></div>
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] rounded">
            <div className="h-4 bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))]/50 rounded w-4 animate-pulse"></div>
            <div className="h-3 bg-[color-mix(in_srgb,var(--fg)_45%,var(--bg))] rounded w-28 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarToggle = ({
  isOpen,
  setIsOpen
}: {
  isOpen: string | false;
  setIsOpen: (isOpen: string | false) => void;
}) => {
  const renderIcon = () => {
    switch (isOpen !== false) {
      case true:
        return <PanelLeftClose size={24} />;
      case false:
        return <Menu size={24} />;
    }
  };
  return (
    <li
      onClick={() => {
        if (isOpen) {
          setIsOpen(false);
        } else {
          setIsOpen('Home');
        }
      }}
      className="flex flex-col items-center justify-center gap-1 mb-2 cursor-pointer hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] my-3 py-2.5 mx-4 rounded-md m-1.5"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          initial={{ opacity: 0.3, scale: 0.5, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0.3, scale: 0.5, filter: 'blur(4px)' }}
          key={`sidebar-toggle-${isOpen ? true : false}`}
        >
          {renderIcon()}
        </motion.span>
      </AnimatePresence>
    </li>
  );
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState<string | false>(false);
  const [hovering, setHovering] = useState<string | null>(null);

  const options = [
    {
      name: 'Home',
      icon: <Home size={24} />,
      children: <HomeChildren />
    },
    {
      name: 'Projects',
      icon: <Folder size={24} />,
      children: <ProjectsChildren />
    },
    {
      name: 'Templates',
      icon: <PanelsTopLeft size={24} />,
      children: <TemplatesChildren />
    },
    {
      name: 'AI',
      icon: <Star size={24} />,
      children: <AIChildren />
    },
    {
      name: 'Cloud',
      icon: <Cloud size={24} />,
      children: <CloudChildren />
    }
  ];

  return (
    <div className="h-full flex items-start">
      <ul className="h-full w-20 bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))] flex flex-col gap-1 border-r border-[color-mix(in_srgb,var(--fg)_28%,var(--bg))]">
        <SidebarToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        {options.map((option) => {
          const isActive = isOpen === option.name;

          return (
            <li
              key={option.name}
              onMouseEnter={() => {
                if (!isOpen) setHovering(option.name);
              }}
              onMouseLeave={() => {
                if (!isOpen) {
                  setHovering(null);
                }
              }}
              onClick={() => {
                setIsOpen(option.name);
              }}
              className="group px-1.5 gap-1 py-1 flex flex-col items-center justify-center cursor-pointer select-none"
            >
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 group-hover:bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] p-2.5 rounded-md text-[var(--fg)]/90',
                  isActive && 'bg-[color-mix(in_srgb,var(--fg)_28%,var(--bg))] text-[color-mix(in_srgb,var(--fg)_71%,var(--bg))]'
                )}
              >
                {option.icon}
              </div>
              <p className="text-xs">{option.name}</p>
            </li>
          );
        })}
      </ul>
      <AnimatePresence mode="popLayout" initial={false}>
        {(hovering || isOpen) && (
          <motion.section
            id="sidebar-children"
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0 0 0 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { delay: 0.06 } }}
            transition={{
              duration: 0.2,
              type: 'spring',
              bounce: 0
            }}
            onMouseEnter={() => {
              if (!isOpen) setHovering(isOpen || hovering);
            }}
            onMouseLeave={() => {
              if (!isOpen) setHovering(null);
            }}
            key={isOpen ? isOpen : hovering}
            className="h-full bg-[color-mix(in_srgb,var(--fg)_21%,var(--bg))]"
          >
            <div className="w-[300px] h-full">
              {(isOpen || hovering) &&
                options.find((opt) => opt.name === (isOpen || hovering))?.children}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
