import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function KnowledgeTab() {
  const [knowledgeSearch, setKnowledgeSearch] = useState("");

  const KNOWLEDGE_ITEMS = [
    { title: "Cotton Alternaria Leaf Spot", category: "Fungal diseases", symptoms: "Concentric brown circles on lower crop leaves", causes: "Alternaria macrospora spore spread under humid dew conditions", prevention: "Crop rotation, seed treatment, avoiding overhead sprinklers" },
    { title: "Rice Bacterial Leaf Blight", category: "Bacterial diseases", symptoms: "Water-soaked yellow stripes extending along leaf margins", causes: "Xanthomonas oryzae bacteria entering leaf wounds", prevention: "Use resistant cultivars, balanced nitrogen fertilizers" },
    { title: "Tomato Early Blight", category: "Fungal diseases", symptoms: "Dark target-like rings on older leaves first", causes: "Alternaria solani fungus surviving in weed residues", prevention: "Proper row spacing, mulching, watering from crop base" },
    { title: "Organic Neem Seed Extract Spray Formulation", category: "Formulations", symptoms: "General organic defense", causes: "Active azadirachtin compound repels sucking bugs", prevention: "Mix 50g neem powder in 1L water, ferment 12 hours, add soap surfactant" }
  ].filter(item => 
    item.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    item.symptoms.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(knowledgeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search library bar */}
      <div className="relative">
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
        <Input 
          value={knowledgeSearch} 
          onChange={(e) => setKnowledgeSearch(e.target.value)} 
          placeholder="Search disease library, pests lists, organic formulation recipes..." 
          className="pl-9 h-10 text-sm bg-card text-foreground border-border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {KNOWLEDGE_ITEMS.map((item, idx) => (
          <Card key={idx} className="shadow-sm border-border text-left bg-card text-foreground">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase border-border/80 text-muted-foreground">{item.category}</Badge>
              <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-400 mt-2">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p><span className="font-semibold text-muted-foreground">Symptoms:</span> {item.symptoms}</p>
              <p><span className="font-semibold text-muted-foreground">Causes:</span> {item.causes}</p>
              <p><span className="font-semibold text-muted-foreground">Prevention:</span> {item.prevention}</p>
            </CardContent>
          </Card>
        ))}
        {KNOWLEDGE_ITEMS.length === 0 && (
          <p className="text-xs text-muted-foreground text-center col-span-full py-8">No library articles found.</p>
        )}
      </div>
    </div>
  );
}
