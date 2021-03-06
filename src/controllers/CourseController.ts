import {Request, Response} from 'express';

import {BaseController} from './BaseController';

import {RouteConstants} from '../utils/constants/RouteConstants';

import {ControllerHelper} from '../utils/controller/ControllerHelper';
import {CourseExcelHelper} from '../utils/controller/CourseExcelHelper';

import {CoursesUtil} from '../utils/google/CoursesUtil';
import {StudentUtil} from '../utils/google/StudentUtil';
import {StudentsUtil} from '../utils/mongodb/StudentsUtil';

import {ApplicationLogger} from '../utils/logger/Logger';

import {Course} from '../models/data/Course';
import {Student} from '../models/data/Student';

export class CourseController extends BaseController {

  private static readonly TAG: string = 'CourseController';

  public constructor() {
    super();

    this.initGetMyTeacherCourses();
    this.initGetMyInactiveTeacherCourses();
    this.initUploadCourseStudents();
    this.initGetCourseDataExcel();
  }

  private initGetMyTeacherCourses(): void {
    this.router.get(RouteConstants.Courses.GET_MY_TEACHER_COURSES, async (request: Request, response: Response) => {
      const refreshToken: string = await ControllerHelper.getUserRefreshTokenFromRequest(request);

      await CoursesUtil.getMyTeacherCourses(refreshToken)
      .then((courses: Course[]) => {
        response.json(courses);
      }).catch(error => {
        ApplicationLogger.errorLog({
          tag: CourseController.TAG,
          message: 'Error occured while loading my teacher courses: ' + error
        });

        response.sendStatus(500);
      });
    });
  }

  private initGetMyInactiveTeacherCourses(): void {
    this.router.get(RouteConstants.Courses.GET_MY_INACTIVE_TEACHER_COURSES, async (request: Request, response: Response) => {
      const refreshToken: string = await ControllerHelper.getUserRefreshTokenFromRequest(request);

      await CoursesUtil.getMyInactiveTeacherCourses(refreshToken)
      .then((courses: Course[]) => {
        response.json(courses);
      }).catch(error => {
        ApplicationLogger.errorLog({
          tag: CourseController.TAG,
          message: 'Error occured while loading my inactive teacher courses: ' + error
        });

        response.sendStatus(500);
      });
    });
  }

  private initUploadCourseStudents(): void {
    this.router.post(RouteConstants.Courses.POST_COURSE_STUDENTS, async (request: Request, response: Response) => {
      let courseId: string;
      let fileContent: Buffer;

      try {
        courseId = this.getCourseIdFromRequestBody(request);
        fileContent = this.getFileContentFromRequest(request);
      } catch(error: any) {
        ApplicationLogger.errorLog({
          tag: CourseController.TAG,
          message: error
        });

        response.sendStatus(500);

        return;
      }

      await StudentsUtil.storeStudentsInDb(courseId, fileContent)
      .then(() => {
        response.sendStatus(200);
      }).catch((error: any) => {
        ApplicationLogger.errorLog({
          tag: CourseController.TAG,
          message: 'Could not save students for course ' + error
        });

        response.sendStatus(500);
      });
    });
  }

  private initGetCourseDataExcel(): void {
    this.router.get(RouteConstants.Courses.GET_COURSE_DATA_EXCEL, async (request: Request, response: Response) => {
      const refreshToken: string = await ControllerHelper.getUserRefreshTokenFromRequest(request);
      let courseId: string;

      try {
        courseId = request.query.courseId.toString();
      } catch(erro: any) {
        ApplicationLogger.errorLog({
          tag: CourseController.TAG,
          message: 'courseId is missing'
        });

        response.sendStatus(500);

        return;
      };

      try {
        const course: Course = await CoursesUtil.getCourseById(refreshToken, courseId);
        const students: Student[] = await StudentUtil.getStudentsForCourse(refreshToken, courseId);

        const xlsxContent = CourseExcelHelper.getCourseDataExcel(course, students);

        response.send(xlsxContent);
      } catch (error: any) {
        ApplicationLogger.errorLog({
          tag: CourseController.TAG,
          message: 'Could not create course data!'
        });

        response.sendStatus(500);
      }
    });
  }

  private getCourseIdFromRequestBody(request: Request): string {
    const courseId: string = request.body.courseId;

    if (!courseId) {
      throw new Error('Invalid courseId for uploadCourseStudents!');
    }
  
    return courseId;
  }

  private getFileContentFromRequest(request: Request): Buffer {
    const fileContent: Buffer = request.files[0].buffer;

    if (!fileContent) {
      throw new Error('Invalid fileContent for uploadCourseStudents!');
    }

    return fileContent;
  }
}