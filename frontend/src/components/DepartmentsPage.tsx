import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Trash2, FolderPlus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import * as api from "../services/api";

interface Department {
  id: string;
  name: string;
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [menuItemCounts, setMenuItemCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deptData, menuItems] = await Promise.all([
        api.getDepartments(),
        api.getMenuItems(),
      ]);
      
      setDepartments(deptData);
      
      // Calculate menu item counts per department
      const counts: Record<string, number> = {};
      menuItems.forEach(item => {
        counts[item.department] = (counts[item.department] || 0) + 1;
      });
      setMenuItemCounts(counts);
    } catch (error) {
      console.error("Error loading departments:", error);
      alert("Failed to load departments. Please refresh the page.");
    }
  };

  const handleAdd = () => {
    setNewDeptName("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!newDeptName.trim()) {
      alert("Please enter a department name");
      return;
    }

    try {
      const newDept = await api.createDepartment({ name: newDeptName.trim() });
      setDepartments(prev => [...prev, newDept]);
      setNewDeptName("");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating department:", error);
      alert("Failed to create department. Please try again.");
    }
  };

  const handleDelete = (dept: Department) => {
    setDeptToDelete(dept);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deptToDelete) {
      try {
        await api.deleteDepartment(deptToDelete.id);
        setDepartments(prev => prev.filter(d => d.id !== deptToDelete.id));
        setDeleteDialogOpen(false);
        setDeptToDelete(null);
      } catch (error) {
        console.error("Error deleting department:", error);
        alert("Failed to delete department. Please try again.");
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-gray-900 mb-2">Departments</h2>
            <p className="text-muted-foreground">Manage kitchen and service departments</p>
          </div>
          <Button
            onClick={handleAdd}
            className="text-white transition-all"
            style={{ backgroundColor: '#6D9773' }}
            onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
            onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
          >
            <Plus className="size-4 mr-2" />
            Add Department
          </Button>
        </div>

        {/* Departments List */}
        <div className="grid gap-4">
          {departments.map(dept => (
            <Card key={dept.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6D977320' }}>
                    <FolderPlus className="size-6" style={{ color: '#6D9773' }} />
                  </div>
                  <div>
                    <p className="text-lg text-gray-900 font-medium">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {menuItemCounts[dept.name] || 0} menu items
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(dept)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}

          {departments.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <FolderPlus className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No departments yet</p>
                <Button
                  onClick={handleAdd}
                  variant="outline"
                  style={{ borderColor: '#6D9773', color: '#0C3B2E' }}
                  className="hover:bg-green-50"
                >
                  <Plus className="size-4 mr-2" />
                  Add Your First Department
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>

      {/* Add Department Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Enter the name for the new department
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="dept-name">Department Name *</Label>
            <Input
              id="dept-name"
              placeholder="e.g., Kitchen, Bar, Grill, Bakery"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
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
              Add Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deptToDelete?.name}"? This action cannot be undone.
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
