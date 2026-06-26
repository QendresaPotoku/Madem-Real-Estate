import { useParams, Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { blogPosts } from "@/data/blog";
import { Calendar, User, ArrowLeft } from "lucide-react";
import NotFound from "./not-found";
import { useT } from "@/i18n/useT";

export default function BlogDetail() {
  const { id } = useParams();
  const { t, tx, tEnum, locale } = useT();
  const post = blogPosts.find(p => p.id === id);

  if (!post) return <NotFound />;

  const relatedPosts = blogPosts.filter(p => p.id !== post.id && p.category === post.category).slice(0, 3);
  if (relatedPosts.length < 3) {
    const morePosts = blogPosts.filter(p => p.id !== post.id && !relatedPosts.find(rp => rp.id === p.id)).slice(0, 3 - relatedPosts.length);
    relatedPosts.push(...morePosts);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      {/* Hero Image */}
      <div className="w-full h-[40vh] md:h-[50vh] relative">
        <img
          src={post.image}
          alt={tx(post.title)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <span className="text-[#F3D8A5] tracking-widest text-xs uppercase font-bold mb-4 block bg-[#0B3A36]/80 inline-block px-3 py-1 rounded-sm">
              {tEnum("blogCategory", post.category)}
            </span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl mx-auto leading-tight">
              {tx(post.title)}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 -mt-32 relative z-10 rounded-lg shadow-xl border border-gray-100">
          
          <Link href="/blog" className="text-gray-500 hover:text-[#0B3A36] text-sm font-medium uppercase tracking-wider flex items-center mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("blog.backToBlog")}
          </Link>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-10 pb-6 border-b border-gray-100">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-[#0B3A36]" />
              {post.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-[#0B3A36]" />
              {new Date(post.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-sans">
            {tx(post.content).split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-6">{paragraph}</p>
            ))}
          </div>
          
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="max-w-5xl mx-auto mt-24">
            <h3 className="font-serif text-3xl font-bold text-[#0B3A36] mb-8 text-center border-t border-gray-200 pt-16">{t("blog.relatedArticles")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map(relatedPost => (
                <div key={relatedPost.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[16/10] overflow-hidden">
                    <Link href={`/blog/${relatedPost.id}`}>
                      <img
                        src={relatedPost.image}
                        alt={tx(relatedPost.title)}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  </div>
                  <div className="p-6">
                    <span className="text-[#0B3A36] text-[10px] font-bold uppercase tracking-widest block mb-2">
                      {tEnum("blogCategory", relatedPost.category)}
                    </span>
                    <Link href={`/blog/${relatedPost.id}`}>
                      <h4 className="font-serif text-lg font-bold text-[#0B3A36] mb-3 line-clamp-2 hover:text-gray-600 transition-colors">
                        {tx(relatedPost.title)}
                      </h4>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
