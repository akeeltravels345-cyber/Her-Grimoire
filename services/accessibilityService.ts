import { AccessibilityInfo } from 'react-native';

/**
 * WCAG Color Contrast Levels
 */
export enum ContrastLevel {
  FAIL = 'fail',
  AA = 'AA',
  AAA = 'AAA',
}

/**
 * Accessibility Service for WCAG compliance and accessible design patterns
 */
export class AccessibilityService {
  /**
   * Calculate relative luminance of a color (per WCAG spec)
   * @param rgb - [r, g, b] where each value is 0-255
   */
  private static getLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse hex color to RGB
   */
  private static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : null;
  }

  /**
   * Calculate contrast ratio between two colors (per WCAG spec)
   * @param foreground - Hex color (e.g., "#000000")
   * @param background - Hex color (e.g., "#FFFFFF")
   * @returns Contrast ratio (e.g., 4.5 for AA compliance at 14px)
   */
  static getContrastRatio(foreground: string, background: string): number {
    const fgRgb = this.hexToRgb(foreground);
    const bgRgb = this.hexToRgb(background);

    if (!fgRgb || !bgRgb) {
      console.warn('Invalid color format for contrast calculation');
      return 0;
    }

    const l1 = this.getLuminance(fgRgb);
    const l2 = this.getLuminance(bgRgb);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if colors meet WCAG AA contrast requirements
   * @param foreground - Hex color
   * @param background - Hex color
   * @param fontSize - Font size in pixels (default 14)
   * @param fontWeight - Font weight (default 'normal')
   */
  static meetsWCAGAA(
    foreground: string,
    background: string,
    fontSize: number = 14,
    fontWeight: 'normal' | 'bold' = 'normal'
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    // WCAG AA: 4.5:1 for normal text, 3:1 for large text (18px+)
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
    const minRatio = isLargeText ? 3 : 4.5;
    return ratio >= minRatio;
  }

  /**
   * Check if colors meet WCAG AAA contrast requirements
   * @param foreground - Hex color
   * @param background - Hex color
   * @param fontSize - Font size in pixels (default 14)
   * @param fontWeight - Font weight (default 'normal')
   */
  static meetsWCAGAAA(
    foreground: string,
    background: string,
    fontSize: number = 14,
    fontWeight: 'normal' | 'bold' = 'normal'
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    // WCAG AAA: 7:1 for normal text, 4.5:1 for large text (18px+)
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
    const minRatio = isLargeText ? 4.5 : 7;
    return ratio >= minRatio;
  }

  /**
   * Get contrast level for given colors
   */
  static getContrastLevel(
    foreground: string,
    background: string,
    fontSize: number = 14,
    fontWeight: 'normal' | 'bold' = 'normal'
  ): ContrastLevel {
    if (this.meetsWCAGAAA(foreground, background, fontSize, fontWeight)) {
      return ContrastLevel.AAA;
    }
    if (this.meetsWCAGAA(foreground, background, fontSize, fontWeight)) {
      return ContrastLevel.AA;
    }
    return ContrastLevel.FAIL;
  }

  /**
   * Audit a component's accessibility
   */
  static auditComponentAccessibility(componentInfo: {
    name: string;
    textColor: string;
    backgroundColor: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    hasAccessibilityLabel?: boolean;
    hasAccessibilityHint?: boolean;
    hasAccessibilityRole?: boolean;
    isInteractive?: boolean;
  }): AccessibilityAuditResult {
    const {
      name,
      textColor,
      backgroundColor,
      fontSize = 14,
      fontWeight = 'normal',
      hasAccessibilityLabel = false,
      hasAccessibilityHint = false,
      hasAccessibilityRole = false,
      isInteractive = false,
    } = componentInfo;

    const issues: AccessibilityIssue[] = [];

    // Check contrast
    const contrastLevel = this.getContrastLevel(
      textColor,
      backgroundColor,
      fontSize,
      fontWeight
    );
    if (contrastLevel === ContrastLevel.FAIL) {
      const ratio = this.getContrastRatio(textColor, backgroundColor);
      issues.push({
        severity: 'error',
        issue: 'Insufficient color contrast',
        description: `Contrast ratio ${ratio.toFixed(2)}:1 does not meet WCAG AA standards (minimum 4.5:1 for normal text)`,
        suggestion: 'Adjust text or background color to improve contrast',
      });
    }

    // Check accessibility labels for interactive components
    if (isInteractive && !hasAccessibilityLabel) {
      issues.push({
        severity: 'error',
        issue: 'Missing accessibility label',
        description: 'Interactive components must have an accessibility label for screen readers',
        suggestion: 'Add accessibilityLabel prop describing the component\'s action',
      });
    }

    // Check accessibility role for interactive components
    if (isInteractive && !hasAccessibilityRole) {
      issues.push({
        severity: 'warning',
        issue: 'Missing accessibility role',
        description: 'Interactive components should have an explicit accessibility role',
        suggestion: 'Add accessibilityRole prop (e.g., "button", "link", "switch")',
      });
    }

    // Recommend hints for complex interactions
    if (isInteractive && !hasAccessibilityHint) {
      issues.push({
        severity: 'info',
        issue: 'Missing accessibility hint',
        description: 'Complex interactions benefit from additional hints',
        suggestion: 'Consider adding accessibilityHint for additional context',
      });
    }

    return {
      component: name,
      contrastLevel,
      contrastRatio: this.getContrastRatio(textColor, backgroundColor),
      issues,
      passed: issues.filter(i => i.severity === 'error').length === 0,
    };
  }

  /**
   * Semantic HTML/React Native best practices
   */
  static getSemanticComponentProps(
    componentType: 'button' | 'link' | 'heading' | 'text' | 'switch' | 'image'
  ): Record<string, any> {
    const baseProps: Record<string, Record<string, any>> = {
      button: {
        accessibilityRole: 'button',
        accessible: true,
      },
      link: {
        accessibilityRole: 'link',
        accessible: true,
      },
      heading: {
        accessibilityRole: 'header',
        accessible: true,
      },
      text: {
        accessible: true,
      },
      switch: {
        accessibilityRole: 'switch',
        accessible: true,
      },
      image: {
        accessible: true,
        accessibilityRole: 'image',
      },
    };

    return baseProps[componentType] || {};
  }

  /**
   * Get minimum touch target size (per accessibility guidelines: 44x44 min)
   */
  static getMinimumTouchTargetSize(): number {
    return 44;
  }

  /**
   * Check if view meets minimum touch target size
   */
  static meetsMinimumTouchTarget(width: number, height: number): boolean {
    const minSize = this.getMinimumTouchTargetSize();
    return width >= minSize && height >= minSize;
  }

  /**
   * Get font size recommendations for accessibility
   */
  static recommendedFontSizes = {
    body: 14,
    caption: 12,
    button: 14,
    heading1: 28,
    heading2: 24,
    heading3: 20,
    heading4: 16,
  };

  /**
   * Enable screen reader announcement
   */
  static async announceForAccessibility(message: string): Promise<void> {
    try {
      await AccessibilityInfo.announceForAccessibility(message);
    } catch (error) {
      console.warn('Failed to announce for accessibility:', error);
    }
  }

  /**
   * Generate accessibility audit report
   */
  static generateAuditReport(
    auditResults: AccessibilityAuditResult[]
  ): AccessibilityAuditReport {
    const errors = auditResults.flatMap(r => r.issues.filter(i => i.severity === 'error'));
    const warnings = auditResults.flatMap(r => r.issues.filter(i => i.severity === 'warning'));
    const infos = auditResults.flatMap(r => r.issues.filter(i => i.severity === 'info'));

    return {
      totalComponents: auditResults.length,
      componentsWithIssues: auditResults.filter(r => !r.passed).length,
      errors: errors.length,
      warnings: warnings.length,
      infos: infos.length,
      passed: auditResults.filter(r => r.passed).length,
      issues: [...errors, ...warnings, ...infos],
      summary: `${auditResults.filter(r => r.passed).length}/${auditResults.length} components passed accessibility audit`,
    };
  }
}

/**
 * Accessibility Issue
 */
export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  issue: string;
  description: string;
  suggestion: string;
}

/**
 * Accessibility Audit Result for a single component
 */
export interface AccessibilityAuditResult {
  component: string;
  contrastLevel: ContrastLevel;
  contrastRatio: number;
  issues: AccessibilityIssue[];
  passed: boolean;
}

/**
 * Accessibility Audit Report
 */
export interface AccessibilityAuditReport {
  totalComponents: number;
  componentsWithIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  passed: number;
  issues: AccessibilityIssue[];
  summary: string;
}
