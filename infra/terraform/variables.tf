variable "project_id" {
  description = "Project GCP yang dipakai seluruh produk Hemavision, sama dengan project yang menghosting inference tier."
  type        = string
  default     = "hemavision-503304"
}

variable "region" {
  description = "Region Cloud Run tempat ketiga service inference sudah live."
  type        = string
  default     = "asia-southeast2"
}

variable "inference_service_names" {
  description = "Nama ketiga service Cloud Run inference yang sudah live, dikelola di luar Terraform ini (repo riset), hanya dirujuk di sini untuk pemberian IAM."
  type        = list(string)
  default     = ["hemavision-conjunctiva", "hemavision-palm", "hemavision-nail"]
}
