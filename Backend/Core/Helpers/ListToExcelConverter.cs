using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml.Style;
using OfficeOpenXml;
using System.Drawing;
using System.Text.RegularExpressions;

namespace Core.Helpers
{
    public class ListToExcelConverter
    {
        private static string FormatHeaderName(string propertyName)
        {
            return Regex.Replace(propertyName, @"(?<!^)(?=[A-Z])", " ");
        }

        public static FileContentResult ConvertToExcelFile<T>(List<T> list, string fileName)
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using (var package = new ExcelPackage())
            {
                var worksheet = package.Workbook.Worksheets.Add("Data");

                var properties = typeof(T).GetProperties();

                for (int i = 0; i < properties.Length; i++)
                {
                    var cell = worksheet.Cells[1, i + 1];
                    cell.Value = FormatHeaderName(properties[i].Name);

                    cell.Style.Font.Bold = true;
                    cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    cell.Style.Fill.BackgroundColor.SetColor(Color.LightBlue);

                    cell.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                    cell.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                    cell.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                    cell.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                }

                for (int row = 0; row < list.Count; row++)
                {
                    for (int col = 0; col < properties.Length; col++)
                    {
                        var cell = worksheet.Cells[row + 2, col + 1];
                        var value = properties[col].GetValue(list[row]);

                        if (value is DateTime dateTime)
                        {
                            cell.Value = dateTime;
                            cell.Style.Numberformat.Format = "mm/dd/yyyy hh:mm";
                        }
                        else
                        {
                            cell.Value = value;
                        }

                        cell.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                        cell.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                        cell.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                        cell.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                    }
                }

                worksheet.Cells.AutoFitColumns();

                var content = package.GetAsByteArray();

                return new FileContentResult(content,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                {
                    FileDownloadName = fileName
                };
            }
        }
    }
}
