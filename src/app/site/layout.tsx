import Navigation from "@/components/site/navigation";
import React from "react";

const siteLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full">
      <Navigation />
      {children}
    </div>
  );
};

export default siteLayout;
