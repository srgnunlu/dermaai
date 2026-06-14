import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getCsrfHeaders } from '@/lib/queryClient';

interface SystemSettings {
  enableGemini?: boolean;
  enableOpenAI?: boolean;
  enableClaude?: boolean;
  openaiModel?: string;
  claudeModel?: string;
  openaiAllowFallback?: boolean;
}

export function AdminSettings() {
  const { toast } = useToast();

  const { data: systemSettings, refetch } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/system-settings'],
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<SystemSettings>) => {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await getCsrfHeaders()) },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: 'Settings updated', variant: 'success' });
    },
    onError: (e: any) => {
      toast({ title: 'Failed to update settings', description: e?.message, variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis Controls</CardTitle>
        <CardDescription>Configure which models run for all users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Enable Gemini 3</div>
            <div className="text-sm text-muted-foreground">Run Google Gemini 3 analysis</div>
          </div>
          <Switch
            checked={!!systemSettings?.enableGemini}
            onCheckedChange={(v) => updateMutation.mutate({ enableGemini: v })}
            data-testid="switch-enable-gemini"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Enable GPT-5.5</div>
            <div className="text-sm text-muted-foreground">Run OpenAI GPT-5.5 analysis</div>
          </div>
          <Switch
            checked={!!systemSettings?.enableOpenAI}
            onCheckedChange={(v) => updateMutation.mutate({ enableOpenAI: v })}
            data-testid="switch-enable-openai"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">OpenAI Model</div>
            <div className="text-sm text-muted-foreground">Choose which OpenAI model to use</div>
          </div>
          <Select
            value={systemSettings?.openaiModel || 'gpt-5.5'}
            onValueChange={(v) => updateMutation.mutate({ openaiModel: v })}
          >
            <SelectTrigger className="w-[160px] sm:w-[200px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-5.5">gpt-5.5</SelectItem>
              <SelectItem value="gpt-5.5-pro">gpt-5.5-pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Enable Claude</div>
            <div className="text-sm text-muted-foreground">Run Anthropic Claude analysis</div>
          </div>
          <Switch
            checked={systemSettings?.enableClaude !== false}
            onCheckedChange={(v) => updateMutation.mutate({ enableClaude: v })}
            data-testid="switch-enable-claude"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Claude Model</div>
            <div className="text-sm text-muted-foreground">Choose which Claude model to use</div>
          </div>
          <Select
            value={systemSettings?.claudeModel || 'claude-sonnet-4-6'}
            onValueChange={(v) => updateMutation.mutate({ claudeModel: v })}
          >
            <SelectTrigger className="w-[160px] sm:w-[200px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4-6">claude-sonnet-4-6</SelectItem>
              <SelectItem value="claude-opus-4-8">claude-opus-4-8</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Allow OpenAI Fallback</div>
            <div className="text-sm text-muted-foreground">
              If selected model fails, try gpt-4o-mini automatically
            </div>
          </div>
          <Switch
            checked={systemSettings?.openaiAllowFallback !== false}
            onCheckedChange={(v) => updateMutation.mutate({ openaiAllowFallback: v })}
            data-testid="switch-openai-fallback"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminSettings;
