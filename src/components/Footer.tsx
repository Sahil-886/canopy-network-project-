import { SITE, BUILD_INFO, DATA_HONESTY_LABEL } from '../content';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-[#D7DECE] bg-[#E7ECE2] text-xs text-[#3D5A49]">
      <div className="field-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-[#1C3527]">{SITE.title}</span> &bull; {SITE.subtitle} &bull; {year}
        </div>
        <div className="font-serif italic">
          {DATA_HONESTY_LABEL}
        </div>
        <div>
          <a
            href={BUILD_INFO.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1F6B45] font-semibold hover:underline"
          >
            Source Code (GitHub)
          </a>
        </div>
      </div>
    </footer>
  );
}
