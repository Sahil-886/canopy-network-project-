import { PROBLEM } from '../content';

export default function ProblemSection() {
  return (
    <section id="problem" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="text-column">
          <span className="section-tag">{PROBLEM.speaker}</span>
          <h2 className="section-title">{PROBLEM.title}</h2>
          
          <div className="space-y-4 text-base text-[#1C3527] leading-relaxed mb-10">
            {PROBLEM.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#D7DECE]">
            {PROBLEM.sdgAlignment.map((sdg) => (
              <div key={sdg.goal} className="field-panel">
                <div className="text-xs font-bold text-[#1F6B45] uppercase tracking-wider mb-1">
                  {sdg.goal}: {sdg.title}
                </div>
                <p className="text-xs text-[#3D5A49] leading-relaxed">
                  {sdg.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
