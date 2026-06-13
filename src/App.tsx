import { BrowserRouter, Routes, Route } from "react-router-dom";
import Customizer from "./components/Customizer";
import WidgetEmbed from "./components/WidgetEmbed";
import { TooltipProvider } from "./components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Customizer />} />
          <Route path="/widget" element={<WidgetEmbed />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
