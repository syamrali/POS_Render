import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Trash2, Tag } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import * as api from "../services/api";

interface Category {
  id: string;
  name: string;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [menuItemCounts, setMenuItemCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catData, menuItems] = await Promise.all([
        api.getCategories(),
        api.getMenuItems(),
      ]);
      
      setCategories(catData);
      
      // Calculate menu item counts per category
      const counts: Record<string, number> = {};
      menuItems.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      setMenuItemCounts(counts);
    } catch (error) {
      console.error("Error loading categories:", error);
      alert("Failed to load categories. Please refresh the page.");
    }
  };

  const handleAdd = () => {
    setNewCatName("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!newCatName.trim()) {
      alert("Please enter a category name");
      return;
    }

    try {
      const newCat = await api.createCategory({ name: newCatName.trim() });
      setCategories(prev => [...prev, newCat]);
      setNewCatName("");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  const handleDelete = (cat: Category) => {
    setCatToDelete(cat);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (catToDelete) {
      try {
        await api.deleteCategory(catToDelete.id);
        setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
        setDeleteDialogOpen(false);
        setCatToDelete(null);
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category. Please try again.");
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-gray-900 mb-2">Categories</h2>
            <p className="text-muted-foreground">Manage menu item categories</p>
          </div>
          <Button
            onClick={handleAdd}
            className="text-white transition-all"
            style={{ backgroundColor: '#6D9773' }}
            onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
            onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
          >
            <Plus className="size-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(cat => (
            <Card key={cat.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6D977320' }}>
                    <Tag className="size-6" style={{ color: '#6D9773' }} />
                  </div>
                  <div>
                    <p className="text-lg text-gray-900 font-medium">{cat.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {menuItemCounts[cat.name] || 0} menu items
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cat)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}

          {categories.length === 0 && (
            <Card className="border-dashed col-span-full">
              <CardContent className="p-12 text-center">
                <Tag className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No categories yet</p>
                <Button
                  onClick={handleAdd}
                  variant="outline"
                  style={{ borderColor: '#6D9773', color: '#0C3B2E' }}
                  className="hover:bg-green-50"
                >
                  <Plus className="size-4 mr-2" />
                  Add Your First Category
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Enter the name for the new category
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cat-name">Category Name *</Label>
            <Input
              id="cat-name"
              placeholder="e.g., Appetizers, Mains, Desserts, Beverages"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
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
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{catToDelete?.name}"? This action cannot be undone.
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
