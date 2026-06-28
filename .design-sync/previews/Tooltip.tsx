import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Button,
} from 'corioscan-ui';
import { Info } from 'lucide-react';

export const Hint = () => (
  <TooltipProvider>
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="About this score">
          <Info />
        </Button>
      </TooltipTrigger>
      <TooltipContent>AI confidence: 0.82</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
