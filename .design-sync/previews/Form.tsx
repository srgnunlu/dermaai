import {
  Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage,
  Input, Button,
} from 'corioscan-ui';
import { useForm } from 'react-hook-form';

export const PatientForm = () => {
  const form = useForm({ defaultValues: { mrn: '4471-22', site: '' } });
  return (
    <Form {...form}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
        <FormField
          control={form.control}
          name="mrn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient MRN</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 4471-22" {...field} />
              </FormControl>
              <FormDescription>Medical record number for this case.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="site"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lesion site</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Right forearm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create case</Button>
      </form>
    </Form>
  );
};
