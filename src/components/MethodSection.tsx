import { SOLUTION } from '../content';

interface MethodSectionProps {
  onSelectStage: (stageIndex: number) => void;
}

export default function MethodSection({ onSelectStage }: MethodSectionProps) {
  const handleStageClick = (stageIndex: number) => {
    onSelectStage(stageIndex);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="solution" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="text-column mb-10">
          <span className="section-tag">{SOLUTION.speaker}</span>
          <h2 className="section-title">{SOLUTION.title}</h2>
          <p className="text-lg font-serif italic text-[#1F6B45] mb-4">
            &ldquo;{SOLUTION.keyIdea}&rdquo;
          </p>
          <p className="text-base text-[#3D5A49] leading-relaxed">
            CanopyNet structures the urban greening dilemma into three sequential, mathematically rigorous DSA problems. Click any stage to inspect it directly in the live interactive simulator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SOLUTION.stages.map((stage) => (
            <div
              key={stage.id}
              className="field-panel flex flex-col justify-between hover:border-[#1F6B45] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1F6B45] uppercase tracking-wide">
                    {stage.number}
                  </span>
                  <span className="text-xs text-[#3D5A49] font-mono">
                    Phase {stage.stageIndex + 1}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1C3527] mb-2">
                  {stage.name}
                </h3>
                <div className="text-xs font-semibold text-[#1C3527] mb-3 pb-2 border-b border-[#D7DECE]">
                  {stage.subheading}
                </div>
                <p className="text-sm text-[#3D5A49] leading-relaxed mb-4">
                  {stage.description}
                </p>
                <div className="p-2.5 rounded bg-[#F5F6F0] border border-[#D7DECE] text-xs text-[#1C3527] italic mb-6">
                  <strong>Why this algorithm:</strong> {stage.whyAlgorithm}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStageClick(stage.stageIndex)}
                className="btn-outline w-full text-center"
              >
                Inspect {stage.number} in Demo &rarr;
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
