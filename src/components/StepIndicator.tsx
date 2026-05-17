interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { num: 1, label: '이력서 입력' },
  { num: 2, label: 'AI 분석 결과' },
  { num: 3, label: '자소서 코치' },
]

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div className="flex items-center gap-2 px-4 py-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border
                ${currentStep === step.num
                  ? 'bg-[#5B9BD5] text-white border-[#5B9BD5]'
                  : currentStep > step.num
                  ? 'bg-[#5B9BD5] text-white border-[#5B9BD5] opacity-60'
                  : 'bg-white text-gray-400 border-gray-300'
                }`}
            >
              {step.num}
            </span>
            <span
              className={`text-sm font-medium ${
                currentStep === step.num
                  ? 'text-[#2E6DA4]'
                  : currentStep > step.num
                  ? 'text-[#5B9BD5] opacity-60'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className="w-12 h-px bg-gray-300" />
          )}
        </div>
      ))}
    </div>
  )
}
