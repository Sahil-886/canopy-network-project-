import { DSA_TABLE, BUILD_INFO } from '../content';

export default function AlgorithmsTable() {
  return (
    <section id="algorithms" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="text-column mb-8">
          <span className="section-tag">Computer Science Architecture</span>
          <h2 className="section-title">Data Structures &amp; Algorithms Implemented</h2>
          <p className="text-base text-[#3D5A49] leading-relaxed">
            Every algorithm is handwritten in pure TypeScript with zero third-party graph or math libraries. Designed for complete clarity in university viva examinations.
          </p>
        </div>

        <div className="overflow-x-auto shadow-xs rounded border border-[#D7DECE]">
          <table className="specimen-table">
            <thead>
              <tr>
                <th>Concept</th>
                <th>Used For</th>
                <th>Why Here</th>
                <th>Time Complexity</th>
                <th>Source Code</th>
              </tr>
            </thead>
            <tbody>
              {DSA_TABLE.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-[#1C3527] whitespace-nowrap">
                    {item.concept}
                  </td>
                  <td className="text-sm text-[#1C3527]">
                    {item.usedFor}
                  </td>
                  <td className="text-xs text-[#3D5A49] leading-relaxed">
                    {item.whyHere}
                  </td>
                  <td className="font-mono text-xs text-[#1F6B45] font-semibold whitespace-nowrap">
                    {item.complexity}
                  </td>
                  <td className="text-xs whitespace-nowrap">
                    <a
                      href={`${BUILD_INFO.githubUrl}/blob/main/${item.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#1F6B45]"
                    >
                      {item.file.split('/').pop()}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="figure-caption">
          Table 1: Exhaustive DSA inventory of the CanopyNet client-side optimization engine.
        </p>
      </div>
    </section>
  );
}
