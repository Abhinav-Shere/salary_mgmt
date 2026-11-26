ActiveRecord::Schema[8.1].define(version: 2026_11_26_120000) do
  create_table "employees", force: :cascade do |t|
    t.string "full_name", null: false
    t.string "job_title", null: false
    t.string "country", null: false
    t.string "department", null: false
    t.integer "salary", null: false
    t.string "email", null: false
    t.date "hire_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country", "job_title"], name: "index_employees_on_country_and_job_title"
    t.index ["country"], name: "index_employees_on_country"
    t.index ["email"], name: "index_employees_on_email", unique: true
    t.index ["job_title"], name: "index_employees_on_job_title"
  end
end
