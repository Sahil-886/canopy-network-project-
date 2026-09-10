import { PROBLEM } from '../content';

export default function ProblemSection() {
  return (
    <section id="problem" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="max-w-3xl mx-auto">
          {/* Speaker Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded bg-[#1F6B45]/10 text-[#1F6B45] font-mono text-xs font-bold tracking-wider uppercase">
              {PROBLEM.speaker}
            </span>
            <span className="text-xs text-[#3D5A49] font-sans">
              Oral Presentation &bull; Problem Statement
            </span>
          </div>

          <h2 className="section-title mb-6">
            The Urban Forestry Island Problem
          </h2>

          {/* Spoken Narrative Card */}
          <div className="bg-white border-l-4 border-[#1F6B45] rounded-r-xl p-6 sm:p-8 shadow-sm mb-10 space-y-4">
            <p className="text-base text-[#1C3527] leading-relaxed">
              &ldquo;Cities are planting micro-forests today &mdash; organizations like <strong>Afforestt</strong> and <strong>SayTrees</strong> use methods like Miyawaki forestry. But there&rsquo;s a gap: planting decisions are mostly manual, and forests often end up scattered &mdash; isolated green patches with no connection between them.&rdquo;
            </p>
            <p className="text-base text-[#1C3527] leading-relaxed">
              &ldquo;That&rsquo;s a problem because wildlife needs corridors to move between habitats. <strong>A disconnected forest, no matter how rich, is still just an island.</strong>&rdquo;
            </p>
            <div className="p-4 rounded-lg bg-[#F5F6F0] border border-[#D7DECE] my-4">
              <p className="text-base sm:text-lg font-serif italic text-[#1F6B45] font-semibold leading-snug">
                &ldquo;So we asked: How do you decide where to plant, and how do you make sure what you plant connects into one living ecosystem &mdash; not isolated patches?&rdquo;
              </p>
            </div>
            <p className="text-sm text-[#3D5A49]">
              This ties directly to <strong>SDG 11 &mdash; Sustainable Cities</strong> and <strong>SDG 15 &mdash; Life on Land</strong>.
            </p>
          </div>

          {/* SDG Alignment Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#D7DECE]">
            {PROBLEM.sdgAlignment.map((sdg) => (
              <div key={sdg.goal} className="field-panel bg-white border border-[#D7DECE] rounded-lg p-5">
                <div className="text-xs font-bold text-[#1F6B45] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1F6B45]" />
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
