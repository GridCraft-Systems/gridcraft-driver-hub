import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  Upload, Check, X, FileText, Image, AlertCircle, 
  Star, Camera 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  // Driver Info
  uberRating: string;
  tripsCompleted: string;
  yearsExperience: string;
  platformScreenshot: File | null;
  
  // Questions
  canProvideDeposit: string;
  rentalType: string;
  hasParkingSpace: string;
  whyJoin: string;
  
  // Documents
  idDocument: File | null;
  driversLicenseFront: File | null;
  driversLicenseBack: File | null;
  proofOfResidence: File | null;
}

const initialFormData: FormData = {
  uberRating: "",
  tripsCompleted: "",
  yearsExperience: "",
  platformScreenshot: null,
  canProvideDeposit: "",
  rentalType: "",
  hasParkingSpace: "",
  whyJoin: "",
  idDocument: null,
  driversLicenseFront: null,
  driversLicenseBack: null,
  proofOfResidence: null,
};

const ApplicationForm = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const isFieldComplete = (field: keyof FormData): boolean => {
    const value = formData[field];
    if (value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    return true;
  };

  const getCompletionStatus = () => {
    const requiredFields: (keyof FormData)[] = [
      "uberRating", "tripsCompleted", "yearsExperience", "platformScreenshot",
      "canProvideDeposit", "rentalType", "hasParkingSpace", "whyJoin",
      "idDocument", "driversLicenseFront", "driversLicenseBack", "proofOfResidence"
    ];
    
    const completed = requiredFields.filter(field => isFieldComplete(field)).length;
    return { completed, total: requiredFields.length };
  };

  const isFormComplete = () => {
    const { completed, total } = getCompletionStatus();
    return completed === total;
  };

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filePath = `${prefix}_${timestamp}.${extension}`;
    
    const { error } = await supabase.storage
      .from("application-documents")
      .upload(filePath, file);

    if (error) {
      throw new Error(`Failed to upload ${prefix}: ${error.message}`);
    }

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete()) {
      toast.error("Please complete all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload all files
      const uploadedFiles = {
        profileScreenshotPath: formData.platformScreenshot 
          ? await uploadFile(formData.platformScreenshot, "profile_screenshot") 
          : "",
        idDocumentPath: formData.idDocument 
          ? await uploadFile(formData.idDocument, "id_document") 
          : "",
        driversLicenseFrontPath: formData.driversLicenseFront 
          ? await uploadFile(formData.driversLicenseFront, "license_front") 
          : "",
        driversLicenseBackPath: formData.driversLicenseBack 
          ? await uploadFile(formData.driversLicenseBack, "license_back") 
          : "",
        proofOfResidencePath: formData.proofOfResidence 
          ? await uploadFile(formData.proofOfResidence, "proof_of_residence") 
          : "",
      };

      // Call edge function to send email
      const response = await supabase.functions.invoke("send-application", {
        body: {
          rating: formData.uberRating,
          trips: formData.tripsCompleted,
          experience: formData.yearsExperience,
          securityDeposit: formData.canProvideDeposit,
          rentalType: formData.rentalType,
          safeParking: formData.hasParkingSpace,
          whyJoin: formData.whyJoin,
          ...uploadedFiles,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Application submitted successfully! We'll contact you within 24-48 hours.");
      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`Failed to submit application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadZone = ({ 
    field, 
    label, 
    accept = ".pdf,.jpg,.jpeg,.png",
    icon: Icon = FileText 
  }: { 
    field: keyof FormData; 
    label: string; 
    accept?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }) => {
    const file = formData[field] as File | null;
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <div
        onClick={() => inputRef.current?.click()}
        className={`upload-zone ${file ? 'uploaded' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
        />
        <div className="flex flex-col items-center gap-3">
          {file ? (
            <>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-accent" />
              </div>
              <span className="text-sm text-accent font-medium">{file.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileChange(field, null);
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">Click to upload</span>
            </>
          )}
        </div>
      </div>
    );
  };

  const CheckIndicator = ({ complete }: { complete: boolean }) => (
    <div className={`check-indicator ${complete ? 'complete' : 'incomplete'}`}>
      {complete ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    </div>
  );

  const { completed, total } = getCompletionStatus();
  const progress = (completed / total) * 100;

  return (
    <section id="apply" className="section-padding relative" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Apply Now</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 mb-6">
            Start Your <span className="gradient-text">Journey</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete the application form below. Make sure to fill in all fields 
            and upload the required documents for a faster approval process.
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Application Progress</span>
            <span className="text-primary font-semibold">{completed}/{total} Complete</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--gradient-primary)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Driver Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-8 mb-6"
          >
            <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-3">
              <Star className="w-5 h-5 text-primary" />
              Driver Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckIndicator complete={isFieldComplete("uberRating")} />
                  Current Uber/Bolt Rating
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4.85"
                  className="input-glass w-full"
                  value={formData.uberRating}
                  onChange={(e) => handleInputChange("uberRating", e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckIndicator complete={isFieldComplete("tripsCompleted")} />
                  Number of Trips Completed
                </label>
                <input
                  type="text"
                  placeholder="e.g., 500"
                  className="input-glass w-full"
                  value={formData.tripsCompleted}
                  onChange={(e) => handleInputChange("tripsCompleted", e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckIndicator complete={isFieldComplete("yearsExperience")} />
                  Years of Experience
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2"
                  className="input-glass w-full"
                  value={formData.yearsExperience}
                  onChange={(e) => handleInputChange("yearsExperience", e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckIndicator complete={isFieldComplete("platformScreenshot")} />
                  Platform Profile Screenshot
                </label>
                <FileUploadZone 
                  field="platformScreenshot" 
                  label="Upload your Uber/Bolt profile screenshot"
                  accept=".jpg,.jpeg,.png"
                  icon={Camera}
                />
              </div>
            </div>
          </motion.div>

          {/* Questions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card p-8 mb-6"
          >
            <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              Important Questions
            </h3>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("canProvideDeposit")} />
                  Are you able to provide a R5,000 Security Deposit?
                </label>
                <div className="flex gap-4">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleInputChange("canProvideDeposit", option)}
                      className={`px-6 py-3 rounded-xl border transition-all duration-300 ${
                        formData.canProvideDeposit === option
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-white/10 hover:border-primary/50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("rentalType")} />
                  Are you looking for a pure rental or a Rent-to-Own path?
                </label>
                <div className="flex gap-4 flex-wrap">
                  {["Pure Rental", "Rent-to-Own"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleInputChange("rentalType", option)}
                      className={`px-6 py-3 rounded-xl border transition-all duration-300 ${
                        formData.rentalType === option
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-white/10 hover:border-primary/50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("hasParkingSpace")} />
                  Do you have a safe, locked place to park the vehicle at night?
                </label>
                <div className="flex gap-4">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleInputChange("hasParkingSpace", option)}
                      className={`px-6 py-3 rounded-xl border transition-all duration-300 ${
                        formData.hasParkingSpace === option
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-white/10 hover:border-primary/50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("whyJoin")} />
                  Why would you like to join the GridCraft Systems Rent-to-Own program?
                </label>
                <textarea
                  placeholder="Tell us about your goals and why you'd like to join our program..."
                  className="input-glass w-full min-h-[120px] resize-none"
                  value={formData.whyJoin}
                  onChange={(e) => handleInputChange("whyJoin", e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Document Uploads */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-card p-8 mb-8"
          >
            <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-3">
              <Upload className="w-5 h-5 text-primary" />
              Documentation Uploads
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("idDocument")} />
                  ID Document (PDF/JPG)
                </label>
                <FileUploadZone field="idDocument" label="Upload ID Document" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("driversLicenseFront")} />
                  Driver's License & PrDP (Front)
                </label>
                <FileUploadZone field="driversLicenseFront" label="Upload License Front" icon={Image} />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("driversLicenseBack")} />
                  Driver's License & PrDP (Back)
                </label>
                <FileUploadZone field="driversLicenseBack" label="Upload License Back" icon={Image} />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckIndicator complete={isFieldComplete("proofOfResidence")} />
                  Proof of Residence (Not older than 3 months)
                </label>
                <FileUploadZone field="proofOfResidence" label="Upload Proof of Residence" />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <button
              type="submit"
              disabled={!isFormComplete() || isSubmitting}
              className={`btn-primary px-12 py-4 text-lg inline-flex items-center gap-3 ${
                !isFormComplete() || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
            
            {!isFormComplete() && (
              <p className="text-muted-foreground text-sm mt-4">
                Please complete all required fields to submit your application.
              </p>
            )}
          </motion.div>
        </form>
      </div>
    </section>
  );
};

export default ApplicationForm;