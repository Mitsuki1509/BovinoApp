import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

const Modal = ({
  open,
  onOpenChange,
  title = "¿Está seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  loading = false,
  onConfirm,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />,
        };
      case 'warning':
        return {
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />,
        };
      default:
        return {
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: null,
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirm = async () => {
    await onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-0 text-center flex flex-col items-center justify-center">
        <DialogHeader className="w-full flex flex-col items-center">
          <div className="flex flex-col items-center gap-3">
            <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm sm:text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="w-full flex flex-col gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            className={`w-full ${styles.confirmButton}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
