import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderPlus,
  Upload,
  Trash2,
  Edit2,
  ChevronRight,
  Home,
  Music,
  LogOut,
  Loader2,
  FolderOpen,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Folder {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_visible: boolean;
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  folder_id: string | null;
  file_url: string;
  duration_formatted: string | null;
  bpm: number | null;
  genre: string | null;
  is_visible: boolean;
}

export default function AdminMusic() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  
  // Modals
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showEditTrack, setShowEditTrack] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'track'; id: string; name: string } | null>(null);
  
  // Form states
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin/login");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load folders and tracks
  useEffect(() => {
    if (!user) return;
    loadContent();
  }, [user, currentFolderId]);

  const loadContent = async () => {
    try {
      // Load subfolders
      const { data: foldersData, error: foldersError } = await supabase
        .from("folders")
        .select("*")
        .eq("parent_id", currentFolderId ?? null)
        .order("sort_order", { ascending: true });

      if (foldersError) throw foldersError;
      setFolders(foldersData || []);

      // Load tracks in current folder
      const { data: tracksData, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .eq("folder_id", currentFolderId ?? null)
        .order("sort_order", { ascending: true });

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);

      // Load breadcrumbs
      if (currentFolderId) {
        const { data: pathData } = await supabase
          .rpc("get_folder_path", { folder_id: currentFolderId });
        setBreadcrumbs(pathData || []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error("Error loading content:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase.from("folders").insert({
        name: newFolderName.trim(),
        slug: generateSlug(newFolderName),
        parent_id: currentFolderId,
      });

      if (error) throw error;

      toast({ title: "Carpeta creada", description: newFolderName });
      setNewFolderName("");
      setShowNewFolder(false);
      loadContent();
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la carpeta",
        variant: "destructive",
      });
    }
  };

  const uploadTracks = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const totalFiles = uploadFiles.length;
    let uploaded = 0;

    try {
      for (const file of Array.from(uploadFiles)) {
        // Generate unique path
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = currentFolderId ? `${currentFolderId}/${fileName}` : fileName;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("music")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("music")
          .getPublicUrl(filePath);

        // Parse filename for metadata (format: Artist - Title.mp3)
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        let artist = "Unknown Artist";
        let title = baseName;

        if (baseName.includes(" - ")) {
          const parts = baseName.split(" - ");
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }

        // Insert track record
        const { error: insertError } = await supabase.from("tracks").insert({
          title,
          artist,
          folder_id: currentFolderId,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_size_bytes: file.size,
          file_format: fileExt?.toLowerCase() || "mp3",
        });

        if (insertError) throw insertError;

        uploaded++;
        setUploadProgress(Math.round((uploaded / totalFiles) * 100));
      }

      toast({
        title: "Archivos subidos",
        description: `${uploaded} archivos subidos correctamente`,
      });
      setShowUpload(false);
      setUploadFiles(null);
      loadContent();
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        title: "Error",
        description: "Error al subir archivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateTrack = async () => {
    if (!editingTrack) return;

    try {
      const { error } = await supabase
        .from("tracks")
        .update({
          title: editingTrack.title,
          artist: editingTrack.artist,
          genre: editingTrack.genre,
          bpm: editingTrack.bpm,
          is_visible: editingTrack.is_visible,
        })
        .eq("id", editingTrack.id);

      if (error) throw error;

      toast({ title: "Track actualizado" });
      setShowEditTrack(false);
      setEditingTrack(null);
      loadContent();
    } catch (error) {
      console.error("Error updating track:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "folder") {
        const { error } = await supabase
          .from("folders")
          .delete()
          .eq("id", deleteTarget.id);
        if (error) throw error;
      } else {
        // Get track to delete file from storage
        const track = tracks.find((t) => t.id === deleteTarget.id);
        if (track) {
          // Delete from storage (get path from URL)
          const urlParts = track.file_url.split("/music/");
          if (urlParts[1]) {
            await supabase.storage.from("music").remove([urlParts[1]]);
          }
        }
        const { error } = await supabase
          .from("tracks")
          .delete()
          .eq("id", deleteTarget.id);
        if (error) throw error;
      }

      toast({ title: "Eliminado correctamente" });
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadContent();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  const toggleVisibility = async (type: 'folder' | 'track', id: string, currentVisibility: boolean) => {
    try {
      const table = type === 'folder' ? 'folders' : 'tracks';
      const { error } = await supabase
        .from(table)
        .update({ is_visible: !currentVisibility })
        .eq("id", id);

      if (error) throw error;
      loadContent();
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Music className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">Admin Music Library</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-6 text-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Inicio
          </button>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button onClick={() => setShowNewFolder(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Nueva Carpeta
          </Button>
          <Button variant="secondary" onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Subir Archivos
          </Button>
        </div>

        {/* Folders Grid */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Carpetas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative group p-4 rounded-xl border ${
                    folder.is_visible 
                      ? "bg-card border-border" 
                      : "bg-muted/50 border-dashed border-muted-foreground/30"
                  } cursor-pointer hover:border-primary transition-colors`}
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <FolderOpen className="w-10 h-10 text-primary mb-2" />
                  <p className="font-medium truncate">{folder.name}</p>
                  
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility('folder', folder.id, folder.is_visible);
                      }}
                      className="p-1 rounded bg-background/80 hover:bg-background"
                    >
                      {folder.is_visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name });
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks List */}
        {tracks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Tracks ({tracks.length})</h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center gap-4 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors ${
                    !track.is_visible ? "opacity-50" : ""
                  }`}
                >
                  <Music className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {track.bpm && (
                      <span className="text-xs text-muted-foreground">{track.bpm} BPM</span>
                    )}
                    {track.genre && (
                      <span className="text-xs px-2 py-1 bg-secondary rounded-full">{track.genre}</span>
                    )}
                    <button
                      onClick={() => toggleVisibility('track', track.id, track.is_visible)}
                      className="p-2 rounded hover:bg-muted"
                    >
                      {track.is_visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTrack(track);
                        setShowEditTrack(true);
                      }}
                      className="p-2 rounded hover:bg-muted"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget({ type: 'track', id: track.id, name: track.title });
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 rounded hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {folders.length === 0 && tracks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Esta carpeta está vacía</p>
            <p className="text-sm">Crea una carpeta o sube archivos para comenzar</p>
          </div>
        )}
      </main>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Carpeta</DialogTitle>
            <DialogDescription>
              Crea una nueva carpeta para organizar tu música
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la carpeta</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ej: Reggaeton 2024"
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                Cancelar
              </Button>
              <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Archivos</DialogTitle>
            <DialogDescription>
              Sube archivos MP3 a la carpeta actual. El formato debe ser "Artista - Título.mp3"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Archivos de audio</Label>
              <Input
                type="file"
                accept="audio/*"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
                className="mt-2"
              />
            </div>
            {uploadFiles && (
              <p className="text-sm text-muted-foreground">
                {uploadFiles.length} archivo(s) seleccionado(s)
              </p>
            )}
            {uploading && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-center">{uploadProgress}%</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUpload(false)} disabled={uploading}>
                Cancelar
              </Button>
              <Button onClick={uploadTracks} disabled={!uploadFiles || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Track Dialog */}
      <Dialog open={showEditTrack} onOpenChange={setShowEditTrack}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Track</DialogTitle>
          </DialogHeader>
          {editingTrack && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={editingTrack.title}
                  onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Artista</Label>
                <Input
                  value={editingTrack.artist}
                  onChange={(e) => setEditingTrack({ ...editingTrack, artist: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Género</Label>
                  <Input
                    value={editingTrack.genre || ""}
                    onChange={(e) => setEditingTrack({ ...editingTrack, genre: e.target.value })}
                    placeholder="Reggaeton"
                  />
                </div>
                <div>
                  <Label>BPM</Label>
                  <Input
                    type="number"
                    value={editingTrack.bpm || ""}
                    onChange={(e) => setEditingTrack({ ...editingTrack, bpm: parseInt(e.target.value) || null })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditTrack(false)}>
                  Cancelar
                </Button>
                <Button onClick={updateTrack}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deleteTarget?.type === 'folder' ? 'carpeta' : 'track'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'folder'
                ? "Se eliminarán todas las subcarpetas y tracks dentro de esta carpeta."
                : `Se eliminará "${deleteTarget?.name}" permanentemente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
