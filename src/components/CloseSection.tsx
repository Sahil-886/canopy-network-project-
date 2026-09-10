import { BUILD_INFO, TEAM_INFO } from '../content';

export default function CloseSection() {
  return (
    <section id="close" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        {/* Pitch Closing Statement */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded bg-[#1F6B45]/10 text-[#1F6B45] font-mono text-xs font-bold tracking-wider uppercase">
              BOTH &bull; Presentation Close
            </span>
            <span className="text-xs text-[#3D5A49] font-sans">
              Final Synthesis &amp; Takeaway
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C3527] leading-tight mb-6">
            That&rsquo;s why we call it CanopyNet: not just forests, a network.
          </h2>

          {/* Verbatim Dialogue Script Card */}
          <div className="bg-white border-l-4 border-[#1F6B45] rounded-r-xl p-6 sm:p-8 shadow-sm space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E7ECE2] text-[#1F6B45] shrink-0 mt-0.5">
                SPEAKER 1
              </span>
              <p className="text-base text-[#1C3527] italic">
                &ldquo;CanopyNet maximizes canopy cover, minimizes cost and land, and guarantees every patch stays connected.&rdquo;
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E7ECE2] text-[#1F6B45] shrink-0 mt-0.5">
                SPEAKER 2
              </span>
              <p className="text-base text-[#1C3527] italic">
                &ldquo;It&rsquo;s a decision-support tool &mdash; any city or NGO can plug in real land data and get an optimized, connected forest plan out.&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1F6B45] text-white shrink-0 mt-0.5">
                BOTH
              </span>
              <p className="text-base sm:text-lg font-serif font-bold text-[#1F6B45]">
                &ldquo;That&rsquo;s why we call it CanopyNet &mdash; not just forests, a network. Thank you.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Build Architecture & Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#D7DECE]">
          {/* Build Info */}
          <div className="field-panel">
            <h3 className="text-lg font-serif font-bold text-[#1C3527] mb-2">
              System Architecture &amp; Build
            </h3>
            <p className="text-xs text-[#3D5A49] mb-4 leading-relaxed">
              {BUILD_INFO.execution}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {BUILD_INFO.stack.split(', ').map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 rounded text-xs bg-[#F5F6F0] text-[#1C3527] border border-[#D7DECE] font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
            <a
              href={BUILD_INFO.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs"
            >
              View Repository on GitHub &rarr;
            </a>
          </div>

          {/* Team Info */}
          <div className="field-panel">
            <h3 className="text-lg font-serif font-bold text-[#1C3527] mb-2">
              Academic Project Team
            </h3>
            <p className="text-xs text-[#3D5A49] mb-4">
              {TEAM_INFO.course} &bull; {TEAM_INFO.institution}
            </p>
            <div className="space-y-3">
              {TEAM_INFO.members.map((member, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#F5F6F0] border border-[#D7DECE] flex justify-between items-center"
                >
                  <span className="font-semibold text-xs text-[#1C3527]">
                    {member.name}
                  </span>
                  <span className="text-[11px] text-[#3D5A49]">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
