import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, Button,
} from 'corioscan-ui';

// Rendered open (defaultOpen) so the card shows the dialog itself, not just the
// trigger. cfg.overrides.Dialog pins cardMode:single + a viewport tall enough
// for the overlay.
export const Confirm = () => (
  <Dialog defaultOpen>
    <DialogTrigger asChild>
      <Button variant="outline">Delete case</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete this case?</DialogTitle>
        <DialogDescription>
          This permanently removes lesion #A-1042 and its scan history. This
          action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete case</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
