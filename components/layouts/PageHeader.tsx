import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps {
  text: string;
  icon?: LucideIcon | React.ReactElement;
  onClick?: () => void;
  href?: string;
  variant: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  disabled?: boolean;
}

export interface ChipProps {
  text: string;
  color?: 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';
}

export interface PageHeaderProps {
  backLink?: {
    href: string;
    text: string;
  };
  title: string;
  description?: string;
  primaryButton?: ButtonProps;
  secondaryButton?: ButtonProps;
  tertiaryButton?: ButtonProps;
  chips?: ChipProps[];
  lastUpdated?: Date;
  className?: string;
  showDivider?: boolean;
}

const Button = ({ text, icon: Icon, onClick, href, variant, className, disabled }: ButtonProps) => {
  const baseClasses = "flex flex-row justify-center items-center px-4 py-2.5 gap-2 rounded-lg text-sm font-medium";

  const variantClasses = {
    primary: "bg-primary border border-primary text-white shadow-xs hover:bg-primary/90",
    secondary: "bg-white border border-gray-300 text-gray-700 shadow-xs hover:bg-gray-50",
    tertiary: "bg-transparent text-primary hover:bg-primary/5"
  };

  const buttonClasses = cn(baseClasses, variantClasses[variant], className, disabled && "opacity-50 cursor-not-allowed");

  const renderIcon = () => {
    if (!Icon) return null;
    
    // Check if Icon is a React element
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    
    // Otherwise, treat it as a LucideIcon component
    const LucideIconComponent = Icon as LucideIcon;
    return <LucideIconComponent className="w-5 h-5" />;
  };

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {renderIcon()}
        <span>{text}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonClasses} disabled={disabled}>
      {renderIcon()}
      <span>{text}</span>
    </button>
  );
};

const Chip = ({ text, color = 'gray' }: ChipProps) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
      {text}
    </span>
  );
};

const PageHeader: React.FC<PageHeaderProps> = ({
  backLink,
  title,
  description,
  primaryButton,
  secondaryButton,
  tertiaryButton,
  chips,
  lastUpdated,
  className,
  showDivider = true
}) => {
  return (
    <div className={cn("flex flex-col gap-6   w-full", className)}>
      {backLink && (
        <Link href={backLink.href} className="flex items-center gap-2 text-primary font-medium text-sm hover:underline w-fit">
          <ArrowLeft className="w-5 h-5" />
          {backLink.text}
        </Link>
      )}

      <div className="flex flex-col gap-5 w-full ">
        <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-medium text-gray-900">{title}</h1>
              {chips && chips.length > 0 && (
                <div className="flex gap-2">
                  {chips.map((chip, index) => (
                    <Chip key={index} {...chip} />
                  ))}
                </div>
              )}
            </div>

            {description && (
              <p className="text-gray-500 text-base">{description}</p>
            )}

            {lastUpdated && (
              <p className="text-gray-500 text-sm mt-1">
                Last updated {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {tertiaryButton && (
              <Button {...tertiaryButton} />
            )}
            {secondaryButton && (
              <Button {...secondaryButton} />
            )}
            {primaryButton && (
              <Button {...primaryButton} />
            )}
          </div>
        </div>

        {showDivider && (
          <div className="h-px bg-gray-200 w-full mb-6" />
        )}
      </div>
    </div>
  );
};

export default PageHeader;
