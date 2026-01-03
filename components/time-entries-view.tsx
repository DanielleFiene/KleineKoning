// components/time-entries-view.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTimeEntry, deleteTimeEntry } from "@/app/actions/time-entries";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { Timer } from "@/components/timer";
import { TimerSetupDialog } from "@/components/timer-setup-dialog";
import { TimerStopDialog } from "@/components/timer-stop-dialog";

interface TimeEntry {
  id: string;
  date: string;
  description: string;
  duration_minutes: number;
  clients: { name: string };
  projects: { name: string; rounding_rule: string };
}

interface Client {
  id: string;
  name: string;
}

export function TimeEntriesView({
  initialEntries,
  clients,
  weekStart,
}: {
  initialEntries: any[];
  clients: Client[];
  weekStart: string;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("minutes");
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [timerSetupOpen, setTimerSetupOpen] = useState(false);
  const [timerStopOpen, setTimerStopOpen] = useState(false);
  const [timerData, setTimerData] = useState<{
    durationMinutes: number;
    clientId: string;
    projectId: string;
    description: string;
  } | null>(null);
  const [timerClientId, setTimerClientId] = useState<string | null>(null);
  const [timerProjectId, setTimerProjectId] = useState<string | null>(null);
  const [timerDescription, setTimerDescription] = useState<string>("");
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const currentWeek = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: currentWeek,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });

  // Load all projects for timer
  useEffect(() => {
    const loadAllProjects = async () => {
      const allProjs: any[] = [];
      for (const client of clients) {
        try {
          const response = await fetch(`/api/projects?client_id=${client.id}`);
          const projs = await response.json();
          allProjs.push(...projs);
        } catch (error) {
          console.error(`Error loading projects for client ${client.id}:`, error);
        }
      }
      setAllProjects(allProjs);
    };
    loadAllProjects();
  }, [clients]);

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedProject("");
    if (clientId) {
      try {
        const response = await fetch(`/api/projects?client_id=${clientId}`);
        const projs = await response.json();
        setProjects(projs);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      }
    } else {
      setProjects([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedProject || !durationValue) {
      alert("Vul alle velden in");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("client_id", selectedClient);
      formData.set("project_id", selectedProject);
      formData.set("date", date);
      formData.set("description", description);
      formData.set("duration_value", durationValue);
      formData.set("duration_unit", durationUnit);

      await createTimeEntry(formData);
      
      // Reset form
      setDescription("");
      setDurationValue("");
      setSelectedProject("");
      
      router.refresh();
    } catch (error) {
      alert("Fout: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Weet je zeker dat je deze entry wilt verwijderen?")) {
      try {
        await deleteTimeEntry(id);
        setEntries(entries.filter((e) => e.id !== id));
        router.refresh();
      } catch (error) {
        alert("Fout: " + (error as Error).message);
      }
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = direction === "next" 
      ? addWeeks(currentWeek, 1)
      : subWeeks(currentWeek, 1);
    router.push(`/time?week=${format(newWeek, "yyyy-MM-dd")}`);
  };

  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
  };

  // Timer handlers
  const handleTimerSetup = (data: {
    clientId: string;
    projectId: string;
    description: string;
  }) => {
    // Update timer state in localStorage
    if (typeof window !== "undefined") {
      const currentTimer = localStorage.getItem("kleinekoning_timer");
      let updated;
      if (currentTimer) {
        try {
          const parsed = JSON.parse(currentTimer);
          updated = {
            ...parsed,
            clientId: data.clientId,
            projectId: data.projectId,
            description: data.description,
          };
        } catch {
          updated = {
            isRunning: false,
            startTime: null,
            elapsedSeconds: 0,
            clientId: data.clientId,
            projectId: data.projectId,
            description: data.description,
          };
        }
      } else {
        updated = {
          isRunning: false,
          startTime: null,
          elapsedSeconds: 0,
          clientId: data.clientId,
          projectId: data.projectId,
          description: data.description,
        };
      }
      localStorage.setItem("kleinekoning_timer", JSON.stringify(updated));
      // Trigger storage event for timer component
      window.dispatchEvent(new Event("storage"));
    }
    setTimerClientId(data.clientId);
    setTimerProjectId(data.projectId);
    setTimerDescription(data.description);
    setTimerSetupOpen(false);
  };

  const handleTimerStop = (data: {
    durationMinutes: number;
    clientId: string;
    projectId: string;
    description: string;
  }) => {
    setTimerData(data);
    setTimerStopOpen(true);
  };

  const handleTimerSave = async (data: {
    date: string;
    description: string;
    durationMinutes: number;
  }) => {
    if (!timerData) return;

    try {
      const formData = new FormData();
      formData.set("client_id", timerData.clientId);
      formData.set("project_id", timerData.projectId);
      formData.set("date", data.date);
      formData.set("description", data.description);
      formData.set("duration_value", data.durationMinutes.toString());
      formData.set("duration_unit", "minutes");

      await createTimeEntry(formData);
      
      // Reset timer state
      setTimerClientId(null);
      setTimerProjectId(null);
      setTimerDescription("");
      if (typeof window !== "undefined") {
        localStorage.removeItem("kleinekoning_timer");
      }
      
      router.refresh();
    } catch (error) {
      alert("Fout bij opslaan timer entry: " + (error as Error).message);
    }
  };

  const getProjectRoundingRule = (projectId: string) => {
    const project = allProjects.find((p) => p.id === projectId);
    return (project?.rounding_rule as "none" | "nearest15" | "up15" | "down15") || "none";
  };

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || "";
  };

  const getProjectName = (projectId: string) => {
    return allProjects.find((p) => p.id === projectId)?.name || "";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tijdregistratie</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Registreer je gewerkte uren per project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm font-medium min-w-[140px] sm:min-w-[200px] text-center">
            {format(currentWeek, "d MMM", { locale: nl })} -{" "}
            {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "d MMM yyyy", { locale: nl })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Timer
          onStop={handleTimerStop}
          onSetup={() => setTimerSetupOpen(true)}
          clients={clients}
          projects={allProjects}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Add</CardTitle>
            <CardDescription>Voeg snel een tijdentry toe</CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Klant *</Label>
                <Select
                  value={selectedClient}
                  onValueChange={handleClientChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer klant" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_id">Project *</Label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                  required
                  disabled={!selectedClient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Datum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_value">Duur *</Label>
                <Input
                  id="duration_value"
                  type="number"
                  step="0.25"
                  min="0"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  required
                  placeholder="1.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_unit">Unit *</Label>
                <Select
                  value={durationUnit}
                  onValueChange={setDurationUnit}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minuten</SelectItem>
                    <SelectItem value="quarter">Kwartier</SelectItem>
                    <SelectItem value="hour">Uur</SelectItem>
                    <SelectItem value="day">Dag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Omschrijving *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Wat heb je gedaan?"
              />
            </div>

            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Toevoegen..." : "Toevoegen"}
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Week Overzicht</CardTitle>
          <CardDescription>Entries gegroepeerd per dag</CardDescription>
        </CardHeader>
        <CardContent>
          {weekDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayEntries = entriesByDate[dayStr] || [];
            const dayTotal = dayEntries.reduce(
              (sum, e) => sum + e.duration_minutes,
              0
            );

            return (
              <div key={dayStr} className="mb-6 last:mb-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base sm:text-lg">
                    {format(day, "EEEE d MMMM", { locale: nl })}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    Totaal: {formatDuration(dayTotal)}
                  </span>
                </div>
                {dayEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Geen entries voor deze dag
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="hidden sm:table-cell">Tijd</TableHead>
                          <TableHead className="hidden md:table-cell">Klant</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead className="hidden lg:table-cell">Omschrijving</TableHead>
                          <TableHead className="text-right">Duur</TableHead>
                          <TableHead className="text-right">Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {format(new Date(entry.date + "T00:00:00"), "HH:mm")}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{entry.clients.name}</TableCell>
                            <TableCell className="font-medium">
                              {entry.projects.name}
                              <div className="text-xs text-muted-foreground md:hidden mt-1">
                                {entry.clients.name} • {entry.description}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{entry.description}</TableCell>
                            <TableCell className="text-right">
                              {formatDuration(entry.duration_minutes)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <TimerSetupDialog
        open={timerSetupOpen}
        onOpenChange={setTimerSetupOpen}
        clients={clients}
        onSave={handleTimerSetup}
      />

      {timerData && (
        <TimerStopDialog
          open={timerStopOpen}
          onOpenChange={setTimerStopOpen}
          durationMinutes={timerData.durationMinutes}
          clientName={getClientName(timerData.clientId)}
          projectName={getProjectName(timerData.projectId)}
          roundingRule={getProjectRoundingRule(timerData.projectId)}
          onSave={handleTimerSave}
        />
      )}
    </div>
  );
}

