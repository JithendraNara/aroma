import React from "react";
import { Utensils } from "lucide-react";

const DefaultRecipeImage = ({ title = "Recipe", className = "h-48" }) => {
  return (
    <div
      className={`bg-gray-200 w-full ${className} flex items-center justify-center rounded-t-lg`}
    >
      <div className="text-center p-4">
        <Utensils className="mx-auto text-gray-400 mb-2" size={40} />
        <p className="text-gray-500 font-medium text-sm line-clamp-2">
          {title}
        </p>
      </div>
    </div>
  );
};

export default DefaultRecipeImage;
