// Comprehensive Error Handling System for Toko Hafiz
import React from 'react';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TRAINING_ERROR = 'TRAINING_ERROR',
  PREDICTION_ERROR = 'PREDICTION_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  MODEL_ERROR = 'MODEL_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: {
    operation?: string;
    userId?: string;
    modelId?: string;
    dataSize?: number;
    parameters?: Record<string, any>;
  };
  stack?: string;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 1000;

  /**
   * Create a standardized error
   */
  static createError(
    type: ErrorType,
    severity: ErrorSeverity,
    code: string,
    message: string,
    details?: any,
    context?: AppError['context']
  ): AppError {
    const error: AppError = {
      type,
      severity,
      code,
      message,
      details,
      timestamp: new Date(),
      context,
      stack: new Error().stack
    };

    this.logError(error);
    return error;
  }

  /**
   * Handle data validation errors
   */
  static dataValidationError(field: string, value: any, expected: string): AppError {
    return this.createError(
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.MEDIUM,
      'DATA_VALIDATION_FAILED',
      `Invalid data in field '${field}': expected ${expected}, got ${typeof value}`,
      { field, value, expected },
      { operation: 'data_validation' }
    );
  }

  /**
   * Handle training errors
   */
  static trainingError(operation: string, details: any): AppError {
    return this.createError(
      ErrorType.TRAINING_ERROR,
      ErrorSeverity.HIGH,
      'TRAINING_FAILED',
      `Training operation '${operation}' failed`,
      details,
      { operation: 'model_training' }
    );
  }

  /**
   * Handle prediction errors
   */
  static predictionError(modelId: string, input: any, details: any): AppError {
    return this.createError(
      ErrorType.PREDICTION_ERROR,
      ErrorSeverity.MEDIUM,
      'PREDICTION_FAILED',
      `Prediction failed for model ${modelId}`,
      { input, details },
      { operation: 'prediction', modelId }
    );
  }

  /**
   * Handle model loading errors
   */
  static modelLoadError(modelId: string, details: any): AppError {
    return this.createError(
      ErrorType.MODEL_ERROR,
      ErrorSeverity.HIGH,
      'MODEL_LOAD_FAILED',
      `Failed to load model ${modelId}`,
      details,
      { operation: 'model_loading', modelId }
    );
  }

  /**
   * Handle system errors
   */
  static systemError(operation: string, error: Error): AppError {
    return this.createError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.CRITICAL,
      'SYSTEM_ERROR',
      `System error during ${operation}: ${error.message}`,
      { originalError: error.message, stack: error.stack },
      { operation }
    );
  }

  /**
   * Log error to internal storage
   */
  private static logError(error: AppError): void {
    this.errorLog.unshift(error);

    // Maintain max log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging for development
    console.error(`[${error.severity}] ${error.type}: ${error.message}`, {
      code: error.code,
      details: error.details,
      context: error.context
    });
  }

  /**
   * Get recent errors
   */
  static getRecentErrors(limit: number = 50): AppError[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Get errors by type
   */
  static getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  /**
   * Get errors by severity
   */
  static getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStatistics(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: number;
  } {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    this.errorLog.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recentErrors: this.errorLog.filter(e => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return e.timestamp > oneHourAgo;
      }).length
    };
  }
}

// Error boundary for React components
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    ErrorHandler.systemError('react_component', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorHandler.createError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      'REACT_ERROR_BOUNDARY',
      `React component error: ${error.message}`,
      { errorInfo },
      { operation: 'react_rendering' }
    );
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return React.createElement(FallbackComponent, { error: this.state.error! });
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  return React.createElement('div', {
    className: 'error-fallback p-4 border border-red-300 rounded bg-red-50'
  }, [
    React.createElement('h3', {
      key: 'title',
      className: 'text-red-800 font-semibold'
    }, 'Something went wrong'),
    React.createElement('p', {
      key: 'message',
      className: 'text-red-600 text-sm mt-1'
    }, error.message),
    React.createElement('button', {
      key: 'reload',
      className: 'mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700',
      onClick: () => window.location.reload()
    }, 'Reload Page')
  ]);
};

// Async error wrapper
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        throw ErrorHandler.systemError(operation, error);
      }
      throw ErrorHandler.createError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.MEDIUM,
        'UNKNOWN_ERROR',
        `Unknown error during ${operation}`,
        { error },
        { operation }
      );
    }
  };
}

// Validation helpers
export class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}

export function validateStockData(data: any): void {
  if (typeof data.currentStock !== 'number' || data.currentStock < 0) {
    throw new ValidationError('currentStock', 'must be a non-negative number');
  }
  if (typeof data.avgSales !== 'number' || data.avgSales < 0) {
    throw new ValidationError('avgSales', 'must be a non-negative number');
  }
  if (typeof data.leadTime !== 'number' || data.leadTime <= 0) {
    throw new ValidationError('leadTime', 'must be a positive number');
  }
  if (!['PerluRestock', 'Aman', 'Rendah', 'Cukup', 'Berlebih'].includes(data.status)) {
    throw new ValidationError('status', 'must be a valid stock status');
  }
}