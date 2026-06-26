import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useT } from "@/i18n/useT";
import { legalPages, type LegalPageKey } from "@/i18n/legal";

interface LegalPageProps {
  page: LegalPageKey;
}

export function LegalPage({ page }: LegalPageProps) {
  const { tx } = useT();
  const content = legalPages[page];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />

      <div className="bg-[#0B3A36] py-16 text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{tx(content.title)}</h1>
          <p className="text-gray-300">{tx(content.updated)}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex-grow max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 prose max-w-none text-gray-700">
          {content.blocks.map((block, idx) => {
            if (block.kind === "h2") {
              return <h2 key={idx}>{tx(block.text)}</h2>;
            }
            if (block.kind === "p") {
              const lines = tx(block.text).split("\n");
              return (
                <p key={idx}>
                  {lines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              );
            }
            return (
              <ul key={idx}>
                {block.items.map((item, i) => (
                  <li key={i}>
                    {item.label && <strong>{tx(item.label)} </strong>}
                    {tx(item.text)}
                  </li>
                ))}
              </ul>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
