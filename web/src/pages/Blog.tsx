import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { blogPosts } from "@/data/blog";
import { Link } from "wouter";
import { ArrowRight, Calendar } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function BlogPage() {
  const { t, tx, tEnum, locale } = useT();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  // Extract unique categories
  const categories = ["All", ...new Set(blogPosts.map(post => post.category))];
  
  const filteredPosts = activeCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      <div className="bg-[#0B3A36] py-16 text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("blog.title")}</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">{t("blog.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex-grow">
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-16 border-b border-gray-200 pb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat 
                  ? "text-[#0B3A36] font-bold border-b-2 border-[#0B3A36] -mb-[25px] pb-[25px]" 
                  : "text-gray-500 hover:text-[#0B3A36]"
              }`}
            >
              {cat === "All" ? t("common.all") : tEnum("blogCategory", cat)}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">{t("blog.noArticles")}</div>
        ) : (
          <>
            {/* Featured Post */}
            {activeCategory === "All" && featuredPost && (
              <div className="mb-16">
                <div className="group flex flex-col lg:flex-row bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="lg:w-1/2 aspect-video lg:aspect-auto relative overflow-hidden">
                    <Link href={`/blog/${featuredPost.id}`}>
                      <img
                        src={featuredPost.image}
                        alt={tx(featuredPost.title)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>
                  </div>
                  <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <span className="text-[#F3D8A5] uppercase tracking-widest text-xs font-semibold mb-4 block">
                      {tEnum("blogCategory", featuredPost.category)}
                    </span>
                    <Link href={`/blog/${featuredPost.id}`}>
                      <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0B3A36] mb-4 hover:text-gray-600 transition-colors">
                        {tx(featuredPost.title)}
                      </h2>
                    </Link>
                    <p className="text-gray-600 text-lg mb-8 line-clamp-3">
                      {tx(featuredPost.excerpt)}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(featuredPost.publishedAt).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <Link href={`/blog/${featuredPost.id}`} className="text-[#0B3A36] font-semibold uppercase tracking-wider text-xs flex items-center hover:text-[#F3D8A5] transition-colors">
                        {t("blog.readArticle")} <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(activeCategory === "All" ? regularPosts : filteredPosts).map(post => (
                <div key={post.id} className="group flex flex-col bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <Link href={`/blog/${post.id}`}>
                      <img
                        src={post.image}
                        alt={tx(post.title)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0B3A36] rounded-sm">
                      {tEnum("blogCategory", post.category)}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <Link href={`/blog/${post.id}`}>
                      <h3 className="font-serif text-xl font-bold text-[#0B3A36] mb-3 line-clamp-2 hover:text-gray-600 transition-colors">
                        {tx(post.title)}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                      {tx(post.excerpt)}
                    </p>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(post.publishedAt).toLocaleDateString(locale)}</span>
                      <Link href={`/blog/${post.id}`} className="text-[#0B3A36] font-semibold uppercase tracking-wider hover:text-[#F3D8A5] transition-colors">
                        {t("blog.read")} →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
