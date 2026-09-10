import { BUILD_INFO, TEAM_INFO } from '../content';

export default function CloseSection() {
  return (
    <section id="close" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        {/* Pitch Closing Statement */}
        <div className="text-column mb-12">
          <span className="section-tag">Synthesis</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C3527] leading-tight mb-4">
            That&rsquo;s why we call it CanopyNet: not just forests, a network.
          </h2>
          <p className="text-base text-[#3D5A49] leading-relaxed">
            By grounding urban micro-forestry in classic, explainable data structures and algorithms, cities can move from haphazard tree planting to resilient, contiguous ecological networks where citizens thrive and urban wildlife moves freely.
          </p>
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
