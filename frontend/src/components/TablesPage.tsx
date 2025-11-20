import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import * as api from "../services/api";

interface Table {
  id: string;
  name: string;
  seats: number;
  category: string;
  status: "available" | "occupied";
}

export function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    seats: "2",
    category: "General",
  });

  const categories = ["General", "Family", "Mandi", "Party Hall"];

  // Load tables from API
  useEffect(() => {
    const loadTables = async () => {
      try {
        const tablesData = await api.getTables();
        setTables(tablesData);
      } catch (error) {
        console.error("Error loading tables:", error);
      }
    };
    
    loadTables();
  }, []);

  const handleAdd = () => {
    setEditingTable(null);
    setFormData({ name: "", seats: "2", category: "General" });
    setDialogOpen(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      seats: table.seats.toString(),
      category: table.category,
    });
    setDialogOpen(true);
  };

  const handleDelete = (table: Table) => {
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (tableToDelete) {
      try {
        await api.deleteTable(tableToDelete.id);
        setTables(prev => prev.filter(t => t.id !== tableToDelete.id));
        setDeleteDialogOpen(false);
        setTableToDelete(null);
      } catch (error) {
        console.error("Error deleting table:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("Please enter a table name");
      return;
    }

    const seats = parseInt(formData.seats);

    try {
      if (editingTable) {
        // Edit existing table
        const updatedTable = await api.updateTable(editingTable.id, {
          name: formData.name,
          seats,
          category: formData.category,
        });
        
        setTables(prev =>
          prev.map(t =>
            t.id === editingTable.id ? updatedTable : t
          )
        );
      } else {
        // Add new table
        const newTable = await api.createTable({
          name: formData.name,
          seats,
          category: formData.category,
          status: "available",
        });
        
        setTables(prev => [...prev, newTable]);
      }

      setDialogOpen(false);
      setFormData({ name: "", seats: "2", category: "General" });
    } catch (error) {
      console.error("Error saving table:", error);
    }
  };

  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-gray-900 mb-2">Table Management</h2>
          <p className="text-muted-foreground">Add, edit, and organize restaurant tables</p>
        </div>
        <Button
          onClick={handleAdd}
          className="text-white transition-all"
          style={{ backgroundColor: '#6D9773' }}
          onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
          onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
        >
          <Plus className="size-4 mr-2" />
          Add Table
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border" style={{ backgroundColor: '#6D977310', borderColor: '#6D9773' }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground mb-1">Total Tables</p>
                <p style={{ color: '#0C3B2E' }}>{tables.length}</p>
              </div>
              <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6D9773' }}>
                <Users className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border" style={{ backgroundColor: '#6D977310', borderColor: '#6D9773' }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground mb-1">Total Seats</p>
                <p style={{ color: '#0C3B2E' }}>{tables.reduce((sum, t) => sum + t.seats, 0)}</p>
              </div>
              <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6D9773' }}>
                <Users className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border" style={{ backgroundColor: '#6D977310', borderColor: '#6D9773' }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground mb-1">Categories</p>
                <p style={{ color: '#0C3B2E' }}>{Object.keys(groupedTables).length}</p>
              </div>
              <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6D9773' }}>
                <Users className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables by Category */}
      <div className="space-y-6">
        {Object.entries(groupedTables).map(([category, categoryTables]) => (
          <div key={category}>
            <h3 className="text-gray-900 mb-4">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(categoryTables as Table[])
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(table => (
                  <Card key={table.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-gray-900 mb-1">Table {table.name}</p>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="size-4" />
                            <span>{table.seats} seats</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(table)}
                          className="flex-1"
                        >
                          <Edit className="size-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(table)}
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
            <DialogDescription>
              {editingTable ? "Update table information" : "Enter the details for the new table"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Table Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., A1, B2, VIP1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Number of Seats</Label>
              <Select value={formData.seats} onValueChange={(value) => setFormData({ ...formData, seats: value })}>
                <SelectTrigger id="seats">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 seats</SelectItem>
                  <SelectItem value="4">4 seats</SelectItem>
                  <SelectItem value="6">6 seats</SelectItem>
                  <SelectItem value="8">8 seats</SelectItem>
                  <SelectItem value="10">10 seats</SelectItem>
                  <SelectItem value="12">12 seats</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Table Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="text-white transition-all"
              style={{ backgroundColor: '#6D9773' }}
              onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
              onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
            >
              {editingTable ? "Save Changes" : "Add Table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Table {tableToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}