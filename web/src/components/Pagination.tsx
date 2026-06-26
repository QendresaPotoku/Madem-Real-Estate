import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 border-gray-200 text-[#0B3A36] hover:bg-[#0B3A36] hover:text-[#F3D8A5] transition-colors rounded-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        
        return (
          <Button
            key={page}
            variant={isActive ? "default" : "outline"}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-sm ${
              isActive 
                ? "bg-[#0B3A36] text-[#F3D8A5] border-[#0B3A36] hover:bg-[#072D2A]" 
                : "border-gray-200 text-gray-600 hover:border-[#0B3A36] hover:text-[#0B3A36]"
            }`}
          >
            {page}
          </Button>
        );
      })}

      <Button 
        variant="outline" 
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 border-gray-200 text-[#0B3A36] hover:bg-[#0B3A36] hover:text-[#F3D8A5] transition-colors rounded-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
