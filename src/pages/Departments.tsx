import { useState } from "react";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Candidates from "./Candidates";

type Department = Database["public"]["Enums"]["department"];
const DEPARTMENTS = Constants.public.Enums.department;

const Departments = () => {
  const [active, setActive] = useState<Department>(DEPARTMENTS[0]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Department View</h1>
      <Tabs value={active} onValueChange={(v) => setActive(v as Department)}>
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
