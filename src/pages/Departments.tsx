import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Candidates from "./Candidates";

const DEPARTMENTS = ["HR", "Tech", "Finance", "Marketing", "Operations"];

const Departments = () => {
  const [active, setActive] = useState(DEPARTMENTS[0]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Department View</h1>
      <Tabs value={active} onValueChange={(v) => setActive(v)}>
        <TabsList>
          {DEPARTMENTS.map((d) => (
            <TabsTrigger key={d} value={d}>{d}</TabsTrigger>
          ))}
        </TabsList>
        {DEPARTMENTS.map((d) => (
          <TabsContent key={d} value={d}>
            <Candidates filterDepartment={d} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Departments;
