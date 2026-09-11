import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import './BookingStepper.css';

interface BookingStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  onBackToHome?: () => void;
}

const STEPS = [
  { number: 1, label: 'Chọn bác sĩ' },
  { number: 2, label: 'Ngày & giờ' },
  { number: 3, label: 'Dịch vụ' },
  { number: 4, label: 'Thông tin' },
  { number: 5, label: 'Xác nhận & thanh toán' },
];

export const BookingStepper: React.FC<BookingStepperProps> = ({
  currentStep,
  onStepClick,
  onBackToHome,
}) => {
  return (
    <div className="booking-stepper-bar">
      <div className="container stepper-inner">
        {/* Left: title + breadcrumb */}
        <div className="stepper-left">
          <h1 className="stepper-page-title">Đặt lịch khám</h1>
          <div className="stepper-breadcrumb">
            <button
              type="button"
              className="breadcrumb-home-link"
              onClick={onBackToHome}
            >
              Trang chủ
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Đặt lịch khám</span>
          </div>
        </div>

        {/* Center: step indicators */}
        <div className="stepper-steps-track">
          {STEPS.map((step, index) => {
            const isDone = currentStep > step.number;
            const isActive = currentStep === step.number;
            const isConnectorActive = currentStep >= step.number;

            return (
              <React.Fragment key={step.number}>
                {/* Step bubble */}
                <div
                  className={`stepper-step ${isDone ? 'step-done' : ''} ${isActive ? 'step-active' : ''}`}
                  onClick={() => isDone && onStepClick?.(step.number)}
                  role={isDone ? 'button' : undefined}
                >
                  <div className="step-bubble">
                    {isDone ? <Check size={14} strokeWidth={2.5} /> : step.number}
                  </div>
                  <span className="step-label">{step.label}</span>
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className={`stepper-connector ${isConnectorActive ? 'connector-active' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: back button */}
        <button
          type="button"
          className="stepper-back-btn"
          onClick={onBackToHome}
        >
          <ArrowLeft size={14} />
          <span>về trang chủ</span>
        </button>
      </div>
    </div>
  );
};
