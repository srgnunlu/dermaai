import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Microscope, History, User, Settings, Bell, Mail, Phone, Calendar, MapPin, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";

// Form validation schema
const profileFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  medicalLicenseNumber: z.string().optional(),
  specialization: z.string().optional(),
  hospital: z.string().optional(),
  yearsOfExperience: z.coerce.number().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile and statistics
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/profile"],
  });

  // Form setup
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      medicalLicenseNumber: "",
      specialization: "",
      hospital: "",
      yearsOfExperience: undefined,
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phoneNumber: profile.phoneNumber || "",
        medicalLicenseNumber: profile.medicalLicenseNumber || "",
        specialization: profile.specialization || "",
        hospital: profile.hospital || "",
        yearsOfExperience: profile.yearsOfExperience || undefined,
      });
    }
  }, [profile, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["/api/profile"], updatedProfile);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordChange = () => {
    toast({
      title: "Coming soon",
      description: "Password change functionality will be available soon.",
    });
  };

  const handleEnable2FA = () => {
    toast({
      title: "Coming soon",
      description: "Two-factor authentication will be available soon.",
    });
  };

  // Generate initials for avatar
  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    } else if (profile?.email) {
      return profile.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Failed to load profile data</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">User Profile</h1>
          
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Profile Summary Card */}
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={profile?.profileImageUrl} alt="Profile" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl" data-testid="avatar-fallback">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold text-foreground" data-testid="text-username">
                        {profile?.firstName && profile?.lastName 
                          ? `${profile.firstName} ${profile.lastName}`
                          : profile?.email || "User"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1" data-testid="text-specialization">
                        {profile?.specialization || "Medical Professional"}
                      </p>
                      {profile?.medicalLicenseNumber && (
                        <div className="flex items-center mt-3 text-sm text-muted-foreground">
                          <Award className="mr-1" size={16} />
                          <span data-testid="text-license">{profile.medicalLicenseNumber}</span>
                        </div>
                      )}
                      {profile?.hospital && (
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <MapPin className="mr-1" size={16} />
                          <span data-testid="text-hospital">{profile.hospital}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Cases</span>
                        <span className="font-medium text-foreground" data-testid="text-total-cases">
                          {profile?.statistics?.totalCases || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">This Month</span>
                        <span className="font-medium text-foreground" data-testid="text-month-cases">
                          {profile?.statistics?.thisMonthCases || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy Rate</span>
                        <span className="font-medium text-success" data-testid="text-accuracy">
                          {profile?.statistics?.accuracyRate || 0}%
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Profile Details */}
            <div className="space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {/* Personal Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first-name">First Name</Label>
                            <Input
                              id="first-name"
                              {...form.register("firstName")}
                              disabled={!isEditing}
                              data-testid="input-first-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last-name">Last Name</Label>
                            <Input
                              id="last-name"
                              {...form.register("lastName")}
                              disabled={!isEditing}
                              data-testid="input-last-name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile?.email || ""}
                            disabled
                            data-testid="input-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...form.register("phoneNumber")}
                            disabled={!isEditing}
                            data-testid="input-phone"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Professional Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription>Your medical credentials and specialization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="license">Medical License Number</Label>
                          <Input
                            id="license"
                            {...form.register("medicalLicenseNumber")}
                            disabled={!isEditing}
                            data-testid="input-license"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input
                            id="specialization"
                            {...form.register("specialization")}
                            disabled={!isEditing}
                            data-testid="input-specialization"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospital">Hospital/Clinic</Label>
                          <Input
                            id="hospital"
                            {...form.register("hospital")}
                            disabled={!isEditing}
                            data-testid="input-hospital"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Input
                            id="experience"
                            type="number"
                            {...form.register("yearsOfExperience", { valueAsNumber: true })}
                            disabled={!isEditing}
                            data-testid="input-experience"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Save/Edit Buttons */}
                <div className="flex justify-end gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-edit"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>

              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handlePasswordChange}
                    data-testid="button-change-password"
                  >
                    Change Password
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleEnable2FA}
                    data-testid="button-enable-2fa"
                  >
                    Enable Two-Factor Authentication
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 DermaAI. This tool is for medical professional use only and should not replace clinical judgment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}