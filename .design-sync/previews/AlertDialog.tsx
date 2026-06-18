import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogAction, AlertDialogCancel, Button,
} from 'corioscan-ui';

export const Destructive = () => (
  <AlertDialog defaultOpen>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">Delete all scans</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete all scans for this patient?</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently removes all 128 scans and their AI assessments. This
          action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep scans</AlertDialogCancel>
        <AlertDialogAction>Delete all</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
